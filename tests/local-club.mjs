import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const api = 'http://127.0.0.1:55421', app = 'http://127.0.0.1:3347';
const { LOCAL_ANON_KEY: anon, LOCAL_SERVICE_ROLE_KEY: service } = process.env;
assert.ok(anon && service);
const db = createClient(api, service, { auth: { persistSession: false } });
const users = [], resources = [];
const password = `Test-${randomUUID()}`, tag = randomUUID();
function action(html, marker) {
  const section = [...html.matchAll(/<form[\s\S]*?<\/form>/g)].map(m => m[0]).find(f => marker ? f.includes(marker) : true);
  const id = section?.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1]; assert.ok(id, `action ${marker}`); return id;
}
function form(id, values) { const data = new FormData(); data.set(id, ''); for (const [k, v] of Object.entries(values)) data.set(k, v); return data; }
async function login(email) {
  const html = await (await fetch(`${app}/login`)).text();
  const r = await fetch(`${app}/login`, { method: 'POST', body: form(action(html), { email, password }), redirect: 'manual' });
  assert.equal(r.headers.get('location'), '/'); return r.headers.getSetCookie().map(v => v.split(';')[0]).join('; ');
}
async function submit(path, cookie, marker, values) {
  const page = await fetch(`${app}${path}`, { headers: { cookie } }); assert.equal(page.status, 200);
  const r = await fetch(`${app}${path}`, { method: 'POST', headers: { cookie }, body: form(action(await page.text(), marker), values), redirect: 'manual' });
  return r.headers.get('location');
}
try {
  for (const role of ['admin', 'member', 'member']) {
    const email = `${randomUUID()}@example.test`, created = await db.auth.admin.createUser({ email, password, email_confirm: true }); assert.ifError(created.error);
    const id = created.data.user.id; users.push({ id, email });
    assert.ifError((await db.from('profiles').update({ role, must_change_password: false, username: `u${id.replaceAll('-', '').slice(0, 12)}`, display_name: role }).eq('id', id)).error);
  }
  const [editorCookie, memberCookie] = await Promise.all(users.slice(0, 2).map(u => login(u.email)));
  const member = createClient(api, anon, { auth: { persistSession: false } }); assert.ifError((await member.auth.signInWithPassword({ email: users[1].email, password })).error);
  const member2 = createClient(api, anon, { auth: { persistSession: false } }); assert.ifError((await member2.auth.signInWithPassword({ email: users[2].email, password })).error);
  const editor = createClient(api, anon, { auth: { persistSession: false } }); assert.ifError((await editor.auth.signInWithPassword({ email: users[0].email, password })).error);
  const guest = createClient(api, anon, { auth: { persistSession: false } });
  assert.ok((await guest.from('polls').select()).error, 'anonymous read denied');
  assert.ok((await member.rpc('create_poll', { question_text: 'no', option_labels: ['a', 'b'] })).error, 'member cannot create polls');
  assert.ok((await editor.rpc('create_poll', { question_text: `Duplicati ${tag}`, option_labels: ['A', 'a'] })).error, 'duplicate options rejected');
  assert.equal((await db.from('polls').select('id').eq('question', `Duplicati ${tag}`)).data.length, 0, 'invalid poll creates no partial record');
  assert.equal(await submit('/polls', editorCookie, 'name="question"', { question: `Sondaggio ${tag}`, options: 'Pizza\nPasta' }), '/polls?saved=1');
  const poll = await db.from('polls').select('id,poll_options(id,label)').eq('question', `Sondaggio ${tag}`).single(); assert.ifError(poll.error); resources.push(['polls', poll.data.id]);
  const option = poll.data.poll_options[0].id;
  assert.equal(await submit('/polls', memberCookie, 'name="option"', { poll: poll.data.id, option }), '/polls?voted=1');
  assert.ok((await member.from('poll_votes').insert({ poll_id: poll.data.id, user_id: users[1].id, option_id: option })).error, 'one vote per user');
  assert.ok((await member2.from('poll_votes').insert({ poll_id: poll.data.id, user_id: users[1].id, option_id: option })).error, 'cannot vote for another member');
  assert.equal((await member2.from('poll_votes').select('*').eq('poll_id', poll.data.id)).data.length, 0, 'other votes are private');
  assert.equal((await editor.from('poll_votes').select('*').eq('poll_id', poll.data.id)).data.length, 0, 'admin cannot read individual votes');
  const totals = await member2.rpc('poll_results'); assert.ifError(totals.error); assert.equal(totals.data.find(x => x.option_id === option).votes, 1);
  assert.equal(await submit('/polls', editorCookie, 'Chiudi votazione', { id: poll.data.id }), '/polls?saved=1');
  assert.ok((await member2.from('poll_votes').insert({ poll_id: poll.data.id, user_id: users[2].id, option_id: option })).error, 'closed poll rejects votes');
  const expired = await db.from('polls').insert({ question: `Scaduto ${tag}`, closes_on: '2000-01-01' }).select('id').single(); assert.ifError(expired.error); resources.push(['polls', expired.data.id]);
  const expiredOption = await db.from('poll_options').insert({ poll_id: expired.data.id, label: 'Sì', position: 1 }).select('id').single(); assert.ifError(expiredOption.error);
  assert.ok((await member2.from('poll_votes').insert({ poll_id: expired.data.id, user_id: users[2].id, option_id: expiredOption.data.id })).error, 'expired poll rejects votes');
  assert.ok((await member.from('rankings').insert({ title: 'no' })).error, 'member cannot write rankings');
  assert.equal(await submit('/rankings', editorCookie, 'name="title"', { title: `Classifica ${tag}` }), '/rankings?saved=1');
  const ranking = await db.from('rankings').select('id').eq('title', `Classifica ${tag}`).single(); assert.ifError(ranking.error); resources.push(['rankings', ranking.data.id]);
  assert.equal(await submit('/rankings', editorCookie, 'name="points"', { ranking: ranking.data.id, name: 'Luca', points: '12' }), '/rankings?saved=1');
  assert.equal(await submit('/rankings', editorCookie, 'name="points"', { ranking: ranking.data.id, name: 'Luca', points: '15' }), '/rankings?saved=1');
  const scores = await member.from('ranking_entries').select('name,points').eq('ranking_id', ranking.data.id); assert.ifError(scores.error); assert.deepEqual(scores.data, [{ name: 'Luca', points: 15 }]);
  assert.ok((await member.from('events').insert({ title: 'no', event_date: '2030-01-01' })).error, 'member cannot create events');
  assert.equal(await submit('/events', editorCookie, 'name="date"', { title: `Evento ${tag}`, date: '2030-01-01', time: '20:30', location: 'Casa', description: 'Ci siamo' }), '/events?saved=1');
  const event = await db.from('events').select('id').eq('title', `Evento ${tag}`).single(); assert.ifError(event.error); resources.push(['events', event.data.id]);
  assert.equal(await submit('/events', editorCookie, `value="${event.data.id}"`, { id: event.data.id, title: `Evento ${tag}`, date: '2030-01-02', time: '21:00', location: 'Casa', description: 'Aggiornato' }), '/events?saved=1');
  const updatedEvent = await member.from('events').select('event_date,event_time').eq('id', event.data.id).single(); assert.ifError(updatedEvent.error); assert.equal(updatedEvent.data.event_date, '2030-01-02'); assert.equal(updatedEvent.data.event_time, '21:00:00');
  for (const [url, expected] of [['/polls', `Sondaggio ${tag}`], ['/rankings', `Classifica ${tag}`], ['/events', `Evento ${tag}`]]) {
    const page = await fetch(`${app}${url}`, { headers: { cookie: memberCookie } }); assert.equal(page.status, 200); assert.ok((await page.text()).includes(expected));
    assert.equal((await fetch(`${app}${url}`, { redirect: 'manual' })).headers.get('location'), '/login');
  }
  console.log('PASS: polls, private votes, closure, rankings, events and authorization');
} finally {
  for (const [table, id] of resources) assert.ifError((await db.from(table).delete().eq('id', id)).error);
  for (const user of users) { assert.ifError((await db.from('profiles').delete().eq('id', user.id)).error); assert.ifError((await db.auth.admin.deleteUser(user.id)).error); }
}
