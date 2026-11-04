import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const api = 'http://127.0.0.1:55421', app = 'http://127.0.0.1:3347';
const { LOCAL_ANON_KEY: anon, LOCAL_SERVICE_ROLE_KEY: service } = process.env;
assert.ok(anon && service);
const admin = createClient(api, service, { auth: { persistSession: false } });
const reader = createClient(api, anon, { auth: { persistSession: false } });
const password = `Test-${randomUUID()}`, editorEmail = `editor-${randomUUID()}@example.test`, readerEmail = `reader-${randomUUID()}@example.test`;
const ids = []; let postId;
function action(html) { const id = html.replace(/<form[^>]*>[\s\S]*?logout-button[\s\S]*?<\/form>/g, '').match(/name="(\$ACTION_ID_[^"]+)"/)?.[1]; assert.ok(id); return id; }
function form(key, data) { const f = new FormData(); f.set(key, ''); for (const [k, v] of Object.entries(data)) f.set(k, v); return f; }
async function login(email) {
  const page = await fetch(`${app}/login`);
  const result = await fetch(`${app}/login`, { method: 'POST', body: form(action(await page.text()), { email, password }), redirect: 'manual' });
  assert.equal(result.status, 303);
  return result.headers.getSetCookie().map((s) => s.split(';')[0]).join('; ');
}
try {
  for (const [email, role] of [[editorEmail, 'admin'], [readerEmail, 'member']]) {
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true }); assert.ifError(created.error);
    const id = created.data.user.id; ids.push(id);
    const profile = await admin.from('profiles').update({ role, must_change_password: false, username: `u${id.replaceAll('-', '').slice(0, 12)}`, display_name: role }).eq('id', id); assert.ifError(profile.error);
  }
  const editorCookie = await login(editorEmail), readerCookie = await login(readerEmail);
  let page = await fetch(`${app}/admin/posts/new`, { headers: { cookie: editorCookie } });
  assert.equal(page.status, 200);
  let result = await fetch(`${app}/admin/posts/new`, { method: 'POST', headers: { cookie: editorCookie }, body: form(action(await page.text()), { title: 'Ricordo di prova', content: 'Una bella serata', category: 'serate', status: 'draft' }), redirect: 'manual' });
  assert.equal(result.headers.get('location'), '/admin/posts?saved=1');
  const post = await admin.from('posts').select('id,slug').eq('title', 'Ricordo di prova').eq('author_id', ids[0]).single(); assert.ifError(post.error); postId = post.data.id;
  page = await fetch(`${app}/posts/${post.data.slug}`, { headers: { cookie: readerCookie } }); assert.equal(page.status, 404);
  page = await fetch(`${app}/admin/posts/${postId}`, { headers: { cookie: editorCookie } });
  result = await fetch(`${app}/admin/posts/${postId}`, { method: 'POST', headers: { cookie: editorCookie }, body: form(action(await page.text()), { id: postId, title: 'Ricordo di prova', content: 'Una bella serata', category: 'serate', status: 'published' }), redirect: 'manual' });
  assert.equal(result.headers.get('location'), '/admin/posts?saved=1');
  page = await fetch(`${app}/`, { headers: { cookie: readerCookie } });
  const dashboard = await page.text(); assert.equal(page.status, 200); assert.match(dashboard, /Ricordo di prova/); assert.match(dashboard, /href="\/gallery"/); assert.match(dashboard, /href="\/members"/); assert.doesNotMatch(dashboard, /href="\/admin"/);
  page = await fetch(`${app}/`, { headers: { cookie: editorCookie } }); assert.match(await page.text(), /href="\/admin"/);
  page = await fetch(`${app}/members`, { headers: { cookie: readerCookie } }); const members = await page.text(); assert.equal(page.status, 200); assert.match(members, new RegExp(`u${ids[0].replaceAll('-', '').slice(0, 12)}`));
  page = await fetch(`${app}/members/u${ids[0].replaceAll('-', '').slice(0, 12)}`, { headers: { cookie: readerCookie } }); assert.equal(page.status, 200); assert.match(await page.text(), /Admin/);
  page = await fetch(`${app}/posts/${post.data.slug}`, { headers: { cookie: readerCookie } });
  assert.equal(page.status, 200); const html = await page.text(); assert.match(html, /Una bella serata/);
  const forms = [...html.matchAll(/<form[\s\S]*?<\/form>/g)].map((x) => x[0]);
  const commentForm = forms.find((x) => x.includes('Scrivi un commento')); assert.ok(commentForm);
  result = await fetch(`${app}/posts/${post.data.slug}`, { method: 'POST', headers: { cookie: readerCookie }, body: form(action(commentForm), { post_id: postId, slug: post.data.slug, content: 'Che ricordo!' }), redirect: 'manual' });
  assert.equal(result.status, 303);
  assert.ifError((await reader.auth.signInWithPassword({ email: readerEmail, password })).error);
  const comments = await reader.from('comments').select('content').eq('post_id', postId); assert.ifError(comments.error); assert.equal(comments.data[0].content, 'Che ricordo!');
  const reaction = await reader.from('post_reactions').insert({ post_id: postId, user_id: ids[1], emoji: '🔥' }); assert.ifError(reaction.error);
  page = await fetch(`${app}/posts/${post.data.slug}`, { headers: { cookie: readerCookie } }); assert.match(await page.text(), /Che ricordo!/);
  console.log('PASS: admin draft and publication, private feed, member comment and reaction');
} finally {
  if (postId) assert.ifError((await admin.from('posts').delete().eq('id', postId)).error);
  for (const id of ids) { assert.ifError((await admin.from('profiles').delete().eq('id', id)).error); assert.ifError((await admin.auth.admin.deleteUser(id)).error); }
}
