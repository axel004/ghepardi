import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const api = 'http://127.0.0.1:55421', app = 'http://127.0.0.1:3347';
const { LOCAL_ANON_KEY: anon, LOCAL_SERVICE_ROLE_KEY: service } = process.env;
assert.ok(anon && service);
const admin = createClient(api, service, { auth: { persistSession: false } });
const member = createClient(api, anon, { auth: { persistSession: false } });
const password = `Test-${randomUUID()}`, emails = [`editor-${randomUUID()}@example.test`, `member-${randomUUID()}@example.test`];
const ids = []; let albumId, photoId, postId;
function action(html) { const id = html.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1]; assert.ok(id); return id; }
function form(key, data) { const f = new FormData(); f.set(key, ''); for (const [k, v] of Object.entries(data)) f.set(k, v); return f; }
async function login(email) {
  const page = await fetch(`${app}/login`);
  const result = await fetch(`${app}/login`, { method: 'POST', body: form(action(await page.text()), { email, password }), redirect: 'manual' });
  assert.equal(result.status, 303);
  return result.headers.getSetCookie().map((s) => s.split(';')[0]).join('; ');
}
try {
  for (const [index, email] of emails.entries()) {
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true }); assert.ifError(created.error);
    const id = created.data.user.id; ids.push(id);
    assert.ifError((await admin.from('profiles').update({ role: index ? 'member' : 'admin', must_change_password: false, username: `u${id.replaceAll('-', '').slice(0, 12)}`, display_name: 'Test' }).eq('id', id)).error);
  }
  const editorCookie = await login(emails[0]), memberCookie = await login(emails[1]);
  let page = await fetch(`${app}/admin/gallery`, { headers: { cookie: editorCookie } });
  let response = await fetch(`${app}/admin/gallery`, { method: 'POST', headers: { cookie: editorCookie }, body: form(action(await page.text()), { title: 'Album di prova', event_date: '2026-08-01' }), redirect: 'manual' });
  albumId = response.headers.get('location')?.match(/\/admin\/gallery\/([0-9a-f-]+)$/)?.[1]; assert.ok(albumId);
  const jpeg = await sharp({ create: { width: 16, height: 12, channels: 3, background: '#bb9933' } }).jpeg().toBuffer();
  function upload(file) { const f = new FormData(); f.set('album_id', albumId); f.set('photo', file, 'test.jpg'); return f; }
  response = await fetch(`${app}/api/gallery/upload`, { method: 'POST', headers: { cookie: editorCookie, origin: 'https://other.example' }, body: upload(new Blob([jpeg], { type: 'image/jpeg' })), redirect: 'manual' }); assert.equal(response.status, 403);
  response = await fetch(`${app}/api/gallery/upload`, { method: 'POST', headers: { cookie: memberCookie, origin: app }, body: upload(new Blob([jpeg], { type: 'image/jpeg' })), redirect: 'manual' }); assert.notEqual(response.status, 200);
  response = await fetch(`${app}/api/gallery/upload`, { method: 'POST', headers: { cookie: editorCookie, origin: app }, body: upload(new Blob(['not an image'], { type: 'image/jpeg' })) }); assert.equal(response.status, 400);
  response = await fetch(`${app}/api/gallery/upload`, { method: 'POST', headers: { cookie: editorCookie, origin: app }, body: upload(new Blob([new Uint8Array(2500001)], { type: 'image/jpeg' })) }); assert.equal(response.status, 400);
  response = await fetch(`${app}/api/gallery/upload`, { method: 'POST', headers: { cookie: editorCookie, origin: app }, body: upload(new Blob([jpeg], { type: 'image/jpeg' })) }); assert.equal(response.status, 200);
  const photos = await admin.from('photos').select('id,storage_path').eq('album_id', albumId); assert.ifError(photos.error); assert.equal(photos.data.length, 1); photoId = photos.data[0].id;
  response = await fetch(`${app}/media/${photoId}`, { redirect: 'manual' }); assert.equal(response.status, 307); assert.equal(response.headers.get('location'), '/login');
  response = await fetch(`${app}/media/${photoId}`, { headers: { cookie: memberCookie } }); assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/); assert.equal(response.headers.get('content-type'), 'image/jpeg');
  response = await fetch(`${app}/media/${photoId}?size=thumb`, { headers: { cookie: memberCookie } }); assert.equal(response.status, 200); assert.equal((await sharp(Buffer.from(await response.arrayBuffer())).metadata()).format, 'jpeg');
  const publicFile = await fetch(`${api}/storage/v1/object/public/ghepardi-gallery/${photos.data[0].storage_path}`); assert.notEqual(publicFile.status, 200);
  assert.ifError((await member.auth.signInWithPassword({ email: emails[1], password })).error);
  const denied = await member.storage.from('ghepardi-gallery').upload(`${albumId}/${randomUUID()}.jpg`, jpeg, { contentType: 'image/jpeg' }); assert.ok(denied.error);
  page = await fetch(`${app}/admin/posts/new`, { headers: { cookie: editorCookie } });
  response = await fetch(`${app}/admin/posts/new`, { method: 'POST', headers: { cookie: editorCookie }, body: form(action(await page.text()), { title: 'Post con foto', content: 'Ricordo', category: 'news', status: 'published', cover_photo_id: photoId }), redirect: 'manual' }); assert.equal(response.status, 303);
  const post = await admin.from('posts').select('id,cover_photo_id').eq('author_id', ids[0]).eq('title', 'Post con foto').single(); assert.ifError(post.error); postId = post.data.id; assert.equal(post.data.cover_photo_id, photoId);
  page = await fetch(`${app}/admin/gallery/${albumId}/photo/${photoId}/delete`, { headers: { cookie: editorCookie } });
  response = await fetch(`${app}/admin/gallery/${albumId}/photo/${photoId}/delete`, { method: 'POST', headers: { cookie: editorCookie }, body: form(action(await page.text()), { id: photoId, album_id: albumId }), redirect: 'manual' }); assert.equal(response.status, 303);
  const updated = await admin.from('posts').select('cover_photo_id').eq('id', postId).single(); assert.ifError(updated.error); assert.equal(updated.data.cover_photo_id, null);
  response = await fetch(`${app}/media/${photoId}`, { headers: { cookie: memberCookie } }); assert.equal(response.status, 404);
  console.log('PASS: private album, image upload and validation, cover and deletion');
} finally {
  if (postId) assert.ifError((await admin.from('posts').delete().eq('id', postId)).error);
  if (albumId) {
    const photos = await admin.from('photos').select('id,storage_path').eq('album_id', albumId); assert.ifError(photos.error);
    for (const photo of photos.data) { assert.ifError((await admin.storage.from('ghepardi-gallery').remove([photo.storage_path])).error); assert.ifError((await admin.from('photos').delete().eq('id', photo.id)).error); }
    assert.ifError((await admin.from('albums').delete().eq('id', albumId)).error);
  }
  for (const id of ids) { assert.ifError((await admin.from('profiles').delete().eq('id', id)).error); assert.ifError((await admin.auth.admin.deleteUser(id)).error); }
}
