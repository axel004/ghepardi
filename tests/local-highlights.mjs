import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const api = 'http://127.0.0.1:55421', app = 'http://127.0.0.1:3347';
const { LOCAL_ANON_KEY: anon, LOCAL_SERVICE_ROLE_KEY: service } = process.env;
assert.ok(anon && service);
const db = createClient(api, service, { auth: { persistSession: false } });
const password = `Test-${randomUUID()}`, tag = randomUUID(), users = [], records = [];
let albumId, photoId, photoPath;
function action(html, marker) {
  const section = [...html.matchAll(/<form[\s\S]*?<\/form>/g)].map(m => m[0]).find(f => marker ? f.includes(marker) : true);
  const id = section?.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1]; assert.ok(id, `missing action: ${marker}`); return id;
}
function form(id, values) { const data = new FormData(); data.set(id, ''); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; }
async function login(email) {
  const page = await fetch(`${app}/login`), response = await fetch(`${app}/login`, { method: 'POST', body: form(action(await page.text()), { email, password }), redirect: 'manual' });
  assert.equal(response.headers.get('location'), '/'); return response.headers.getSetCookie().map(s => s.split(';')[0]).join('; ');
}
async function submit(path, cookie, marker, values) {
  const page = await fetch(`${app}${path}`, { headers: { cookie } }); assert.equal(page.status, 200);
  const response = await fetch(`${app}${path}`, { method: 'POST', headers: { cookie }, body: form(action(await page.text(), marker), values), redirect: 'manual' });
  return response.headers.get('location');
}
try {
  for (const role of ['admin', 'member']) {
    const email = `${randomUUID()}@example.test`, created = await db.auth.admin.createUser({ email, password, email_confirm: true }); assert.ifError(created.error);
    const id = created.data.user.id, username = `u${id.replaceAll('-', '').slice(0, 12)}`; users.push({ id, email, username });
    assert.ifError((await db.from('profiles').update({ role, must_change_password: false, username, display_name: `Test ${role}` }).eq('id', id)).error);
  }
  const [adminCookie, memberCookie] = await Promise.all(users.map(user => login(user.email)));
  const member = createClient(api, anon, { auth: { persistSession: false } }), guest = createClient(api, anon, { auth: { persistSession: false } });
  assert.ifError((await member.auth.signInWithPassword({ email: users[1].email, password })).error);
  for (const table of ['monthly_features', 'awards', 'hall_entries']) assert.ok((await guest.from(table).select()).error, 'guest cannot read');
  assert.ok((await member.from('monthly_features').insert({ title: 'no', subject: 'no', feature_month: '2026-01-01' })).error);
  assert.ok((await member.from('awards').insert({ title: 'no', member_id: users[1].id, award_year: 2026 })).error);
  assert.ok((await member.from('hall_entries').insert({ title: 'no', hall: 'fame', entry_year: 2026 })).error);
  const album = await db.from('albums').insert({ title: `Test ${tag}`, created_by: users[0].id }).select('id').single(); assert.ifError(album.error); albumId = album.data.id;
  const jpeg = await sharp({ create: { width: 16, height: 12, channels: 3, background: '#c5a344' } }).jpeg().toBuffer();
  const upload = new FormData(); upload.set('album_id', albumId); upload.set('photo', new Blob([jpeg], { type: 'image/jpeg' }), 'test.jpg');
  const uploaded = await fetch(`${app}/api/gallery/upload`, { method: 'POST', headers: { cookie: adminCookie, origin: app }, body: upload }); assert.equal(uploaded.status, 200);
  const photo = await db.from('photos').select('id,storage_path').eq('album_id', albumId).single(); assert.ifError(photo.error); photoId = photo.data.id; photoPath = photo.data.storage_path;
  const subject = `Test ${tag}`;
  const monthlyValues = { kind: 'monthly', title: 'Ragazza del mese', month: '2026-11', subject, description: 'Una storia', photo_id: photoId };
  const adminPage = await (await fetch(`${app}/monthly`, { headers: { cookie: adminCookie } })).text();
  const forbidden = await fetch(`${app}/monthly`, { method: 'POST', headers: { cookie: memberCookie }, body: form(action(adminPage, 'name="subject"'), monthlyValues), redirect: 'manual' }); assert.equal(forbidden.headers.get('location'), '/');
  assert.equal(await submit('/monthly', adminCookie, 'name="subject"', monthlyValues), '/monthly?saved=1');
  const monthly = await db.from('monthly_features').select('id,photo_id').eq('subject', subject).single(); assert.ifError(monthly.error); records.push(['monthly_features', monthly.data.id]); assert.equal(monthly.data.photo_id, photoId);
  assert.equal(await submit(`/monthly?edit=${monthly.data.id}`, adminCookie, 'name="subject"', { ...monthlyValues, id: monthly.data.id, subject: `${subject} aggiornato` }), '/monthly?saved=1');
  const title = `Premio ${tag}`;
  assert.equal(await submit('/awards', adminCookie, 'name="member_id"', { kind: 'awards', title, year: '2026', member_id: users[1].id, description: 'Meritato' }), '/awards?saved=1');
  const award = await db.from('awards').select('id').eq('title', title).single(); assert.ifError(award.error); records.push(['awards', award.data.id]);
  assert.equal(await submit(`/awards?edit=${award.data.id}`, adminCookie, 'name="member_id"', { kind: 'awards', id: award.data.id, title, year: '2025', member_id: users[1].id, description: 'Aggiornato' }), '/awards?saved=1');
  const memberPage = await (await fetch(`${app}/members/${users[1].username}`, { headers: { cookie: memberCookie } })).text(); assert.ok(memberPage.includes(title), 'award appears in profile');
  const count = await member.from('awards').select('*', { count: 'exact', head: true }).eq('award_year', 2025); assert.ifError(count.error);
  const stats = await (await fetch(`${app}/stats?year=2025`, { headers: { cookie: memberCookie } })).text(); assert.match(stats, new RegExp(`<strong>${count.count}</strong><small>Premi assegnati</small>`));
  for (const [kind, path] of [['fame', '/hall-of-fame'], ['shame', '/hall-of-shame']]) {
    const value = `Momento ${kind} ${tag}`;
    assert.equal(await submit(path, adminCookie, 'name="photo_id"', { kind, title: value, year: '2026', description: 'Memorabile', photo_id: photoId }), `${path}?saved=1`);
    const entry = await db.from('hall_entries').select('id').eq('title', value).single(); assert.ifError(entry.error); records.push(['hall_entries', entry.data.id]);
    assert.equal(await submit(`${path}?edit=${entry.data.id}`, adminCookie, 'name="photo_id"', { kind, id: entry.data.id, title: value, year: '2025', description: 'Modificato', photo_id: photoId }), `${path}?saved=1`);
    const page = await (await fetch(`${app}${path}`, { headers: { cookie: memberCookie } })).text(); assert.ok(page.includes(value)); assert.ok(page.includes(`/media/${photoId}?size=thumb`));
    const other = await (await fetch(`${app}${kind === 'fame' ? '/hall-of-shame' : '/hall-of-fame'}`, { headers: { cookie: memberCookie } })).text(); assert.ok(!other.includes(value), 'halls remain separate');
  }
  const girlPage = await (await fetch(`${app}/monthly-girl`, { headers: { cookie: memberCookie } })).text(); assert.ok(girlPage.includes(`${subject} aggiornato`));
  const guestPage = await fetch(`${app}/hall-of-fame`, { redirect: 'manual' }); assert.equal(guestPage.headers.get('location'), '/login');
  const photoDelete = await db.from('photos').delete().eq('id', photoId); assert.ifError(photoDelete.error); photoId = undefined;
  const retained = await db.from('monthly_features').select('photo_id').eq('id', monthly.data.id).single(); assert.ifError(retained.error); assert.equal(retained.data.photo_id, null);
  const hallRetained = await db.from('hall_entries').select('photo_id').eq('id', records.find(r => r[0] === 'hall_entries')[1]).single(); assert.ifError(hallRetained.error); assert.equal(hallRetained.data.photo_id, null);
  assert.equal(await submit('/awards', adminCookie, `value="${award.data.id}"`, { kind: 'awards', id: award.data.id }), '/awards?deleted=1');
  console.log('PASS: monthly formats, awards, profile, halls, private photos, permissions and deletion');
} finally {
  for (const [table, id] of records) assert.ifError((await db.from(table).delete().eq('id', id)).error);
  if (photoId) assert.ifError((await db.from('photos').delete().eq('id', photoId)).error);
  if (photoPath) assert.ifError((await db.storage.from('ghepardi-gallery').remove([photoPath])).error);
  if (albumId) assert.ifError((await db.from('albums').delete().eq('id', albumId)).error);
  for (const user of users) { assert.ifError((await db.from('profiles').delete().eq('id', user.id)).error); assert.ifError((await db.auth.admin.deleteUser(user.id)).error); }
}
