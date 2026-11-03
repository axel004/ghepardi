import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const api = 'http://127.0.0.1:55421', app = 'http://127.0.0.1:3347';
const { LOCAL_ANON_KEY: anon, LOCAL_SERVICE_ROLE_KEY: service } = process.env;
assert.ok(anon && service, 'Set local keys from supabase status');
const admin = createClient(api, service, { auth: { persistSession: false } });
const member = createClient(api, anon, { auth: { persistSession: false } });
const email = `admin-${randomUUID()}@example.test`, password = `Test-${randomUUID()}`;
const newEmail = `member-${randomUUID()}@example.test`;
let id, newId;
function getAction(html) { const id = html.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1]; assert.ok(id); return id; }
function form(action, values) { const f = new FormData(); f.set(action, ''); for (const [key, value] of Object.entries(values)) f.set(key, value); return f; }
function stateForm(html, values) {
  const section = html.match(/<form[\s\S]*?<\/form>/)?.[0]; assert.ok(section);
  const f = new FormData();
  for (const match of section.matchAll(/<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?\/>/g)) f.set(match[1], (match[2] ?? '').replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
  for (const [key, value] of Object.entries(values)) f.set(key, value);
  return f;
}
try {
  assert.ok((await member.auth.signUp({ email, password })).error, 'public signup is disabled');
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(created.error); id = created.data.user.id;
  assert.ifError((await admin.from('profiles').update({ role: 'admin' }).eq('id', id)).error);
  const loginPage = await fetch(`${app}/login`);
  const login = await fetch(`${app}/login`, { method: 'POST', body: form(getAction(await loginPage.text()), { email, password }), redirect: 'manual' });
  assert.equal(login.status, 303);
  const cookie = login.headers.getSetCookie().map((s) => s.split(';')[0]).join('; ');
  assert.ok(cookie);
  let response = await fetch(`${app}/`, { headers: { cookie }, redirect: 'manual' });
  assert.equal(response.headers.get('location'), '/set-password');
  response = await fetch(`${app}/admin`, { headers: { cookie }, redirect: 'manual' });
  assert.equal(response.headers.get('location'), '/set-password');
  response = await fetch(`${app}/set-password`, { headers: { cookie } });
  const changed = `Changed-${randomUUID()}`;
  response = await fetch(`${app}/set-password`, { method: 'POST', headers: { cookie }, body: form(getAction(await response.text()), { password: changed, confirmation: changed }), redirect: 'manual' });
  assert.equal(response.headers.get('location'), '/profile');
  response = await fetch(`${app}/admin`, { headers: { cookie } });
  assert.equal(response.status, 200);
  const adminFormHtml = await response.text();
  response = await fetch(`${app}/admin`, { method: 'POST', headers: { cookie }, body: stateForm(adminFormHtml, { email: newEmail }) });
  const result = await response.text();
  assert.match(result, /Account creato/);
  const list = await admin.auth.admin.listUsers();
  assert.ifError(list.error);
  newId = list.data.users.find((user) => user.email === newEmail)?.id;
  assert.ok(newId, 'admin action created a real account');
  const generatedPassword = result.match(/Password temporanea: <strong>([^<]+)<\/strong>/)?.[1];
  assert.ok(generatedPassword, 'temporary password is shown once');
  const signin = await member.auth.signInWithPassword({ email: newEmail, password: generatedPassword });
  assert.ifError(signin.error);
  const profiles = await member.from('profiles').select('id');
  assert.ifError(profiles.error); assert.equal(profiles.data.length, 1, 'new member cannot read other profiles');
  assert.ok((await member.from('profiles').update({ role: 'admin' }).eq('id', newId)).error, 'member cannot promote itself');
  const memberLoginPage = await fetch(`${app}/login`);
  const memberLogin = await fetch(`${app}/login`, { method: 'POST', body: form(getAction(await memberLoginPage.text()), { email: newEmail, password: generatedPassword }), redirect: 'manual' });
  const memberCookie = memberLogin.headers.getSetCookie().map((s) => s.split(';')[0]).join('; ');
  const memberPasswordPage = await fetch(`${app}/set-password`, { headers: { cookie: memberCookie } });
  const memberChanged = `Changed-${randomUUID()}`;
  await fetch(`${app}/set-password`, { method: 'POST', headers: { cookie: memberCookie }, body: form(getAction(await memberPasswordPage.text()), { password: memberChanged, confirmation: memberChanged }), redirect: 'manual' });
  const forbidden = await fetch(`${app}/admin`, { method: 'POST', headers: { cookie: memberCookie }, body: stateForm(adminFormHtml, { email: `forbidden-${randomUUID()}@example.test` }), redirect: 'manual' });
  assert.equal(forbidden.headers.get('location'), '/', 'member cannot invoke admin creation action');
  assert.ifError((await admin.from('profiles').update({ status: 'disabled' }).eq('id', id)).error);
  response = await fetch(`${app}/admin`, { headers: { cookie }, redirect: 'manual' });
  assert.equal(response.headers.get('location'), '/login?error=access');
  console.log('PASS: private signup, forced password change, admin account creation, RLS and revocation');
} finally {
  for (const userId of [id, newId].filter(Boolean)) {
    assert.ifError((await admin.from('profiles').delete().eq('id', userId)).error);
    assert.ifError((await admin.auth.admin.deleteUser(userId)).error);
  }
}
