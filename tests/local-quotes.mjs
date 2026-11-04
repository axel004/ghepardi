import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const api = 'http://127.0.0.1:55421', app = 'http://127.0.0.1:3347';
const { LOCAL_ANON_KEY: anon, LOCAL_SERVICE_ROLE_KEY: service } = process.env;
const db = createClient(api, service, { auth: { persistSession: false } }), users = [];
const password = `Test-${randomUUID()}`, phrase = `Perla ${randomUUID()}`; let quoteId;
function action(html, marker) { const section = [...html.matchAll(/<form[\s\S]*?<\/form>/g)].map(m => m[0]).find(f => marker ? f.includes(marker) : true); const id = section?.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1]; assert.ok(id); return id; }
function form(id, values) { const f = new FormData(); f.set(id, ''); for (const [k, v] of Object.entries(values)) f.set(k, v); return f; }
try {
  for (let i = 0; i < 2; i++) {
    const email = `${randomUUID()}@example.test`, created = await db.auth.admin.createUser({ email, password, email_confirm: true }); assert.ifError(created.error); const id = created.data.user.id; users.push({ id, email });
    assert.ifError((await db.from('profiles').update({ must_change_password: false, username: `u${id.replaceAll('-', '').slice(0, 12)}`, display_name: 'Test' }).eq('id', id)).error);
  }
  const page = await fetch(`${app}/login`), login = await fetch(`${app}/login`, { method: 'POST', body: form(action(await page.text()), { email: users[0].email, password }), redirect: 'manual' });
  assert.equal(login.headers.get('location'), '/'); const cookie = login.headers.getSetCookie().map(s => s.split(';')[0]).join('; ');
  const html = await (await fetch(`${app}/quotes`, { headers: { cookie } })).text();
  const created = await fetch(`${app}/quotes`, { method: 'POST', headers: { cookie }, body: form(action(html, 'name="content"'), { content: phrase, speaker: 'Luca' }), redirect: 'manual' }); assert.equal(created.headers.get('location'), '/quotes?saved=1');
  const quote = await db.from('quotes').select('id').eq('content', phrase).single(); assert.ifError(quote.error); quoteId = quote.data.id;
  const one = createClient(api, anon, { auth: { persistSession: false } }), two = createClient(api, anon, { auth: { persistSession: false } });
  assert.ifError((await one.auth.signInWithPassword({ email: users[0].email, password })).error); assert.ifError((await two.auth.signInWithPassword({ email: users[1].email, password })).error);
  assert.ifError((await two.from('quote_votes').insert({ quote_id: quoteId, user_id: users[1].id })).error);
  assert.ok((await two.from('quote_votes').insert({ quote_id: quoteId, user_id: users[1].id })).error, 'one vote');
  assert.ok((await two.from('quote_votes').insert({ quote_id: quoteId, user_id: users[0].id })).error, 'cannot impersonate');
  const forbidden = await two.from('quotes').delete().eq('id', quoteId).select('id'); assert.ifError(forbidden.error); assert.equal(forbidden.data.length, 0, 'cannot delete another member quote');
  const rendered = await (await fetch(`${app}/quotes`, { headers: { cookie } })).text(); assert.ok(rendered.includes(phrase)); assert.ok(rendered.replace(/<[^>]*>/g, '').includes('🐆 1'));
  const stats = await fetch(`${app}/stats?year=${new Date().getUTCFullYear()}`, { headers: { cookie } }); assert.equal(stats.status, 200);
  const statsHtml = await stats.text(); assert.ok(statsHtml.includes('Citazioni')); assert.ok(!statsHtml.includes('Alcuni numeri non sono disponibili'));
  const year = new Date().getUTCFullYear(), counted = await one.from('quotes').select('*', { count: 'exact', head: true }).gte('created_at', `${year}-01-01`).lt('created_at', `${year + 1}-01-01`); assert.ifError(counted.error);
  assert.match(statsHtml, new RegExp(`<strong>${counted.count}</strong><small>Citazioni</small>`));
  const statsGuest = await fetch(`${app}/stats`, { redirect: 'manual' }); assert.equal(statsGuest.headers.get('location'), '/login');
  assert.equal((await fetch(`${app}/quotes`, { redirect: 'manual' })).headers.get('location'), '/login');
  console.log('PASS: quotes, one vote per member, permissions and private access');
} finally {
  if (quoteId) assert.ifError((await db.from('quotes').delete().eq('id', quoteId)).error);
  for (const user of users) { assert.ifError((await db.from('profiles').delete().eq('id', user.id)).error); assert.ifError((await db.auth.admin.deleteUser(user.id)).error); }
}
