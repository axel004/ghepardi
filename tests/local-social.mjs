import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const api = 'http://127.0.0.1:55421', app = 'http://127.0.0.1:3347';
const { LOCAL_ANON_KEY: anon, LOCAL_SERVICE_ROLE_KEY: service } = process.env;
assert.ok(anon && service);
const db = createClient(api, service, { auth: { persistSession: false } }), users = [], records = [];
const password = `Test-${randomUUID()}`, tag = randomUUID(), year = new Date().getUTCFullYear();
function action(html, marker) { const section = [...html.matchAll(/<form[\s\S]*?<\/form>/g)].map(m => m[0]).find(f => marker ? f.includes(marker) : true); const id = section?.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1]; assert.ok(id, `action ${marker}`); return id; }
function form(id, values) { const data = new FormData(); data.set(id, ''); for (const [k, v] of Object.entries(values)) data.set(k, v); return data; }
async function login(email) { const page = await fetch(`${app}/login`); const response = await fetch(`${app}/login`, { method: 'POST', body: form(action(await page.text()), { email, password }), redirect: 'manual' }); assert.equal(response.headers.get('location'), '/'); return response.headers.getSetCookie().map(s => s.split(';')[0]).join('; '); }
try {
  for (const role of ['admin', 'member', 'member']) {
    const email = `${randomUUID()}@example.test`, created = await db.auth.admin.createUser({ email, password, email_confirm: true }); assert.ifError(created.error);
    const id = created.data.user.id, username = `u${id.replaceAll('-', '').slice(0, 12)}`, client = createClient(api, anon, { auth: { persistSession: false } }); users.push({ id, email, username, client });
    assert.ifError((await db.from('profiles').update({ role, must_change_password: false, username, display_name: `Test ${role}` }).eq('id', id)).error);
    assert.ifError((await client.auth.signInWithPassword({ email, password })).error);
  }
  const [a, b, c] = users, [adminCookie, memberCookie] = await Promise.all([login(a.email), login(b.email)]);
  const guest = createClient(api, anon, { auth: { persistSession: false } });
  assert.ok((await guest.from('activity_feed').select()).error); assert.ok((await guest.from('notifications').select()).error); assert.ok((await guest.rpc('wrapped_vote_counts', { wrapped_year: year })).error);
  const slug = `test-${tag}`, post = await a.client.from('posts').insert({ author_id: a.id, title: `Post ${tag}`, slug, content: `Ciao @${b.username}`, category: 'meme', status: 'draft' }).select('id').single(); assert.ifError(post.error); records.push(['posts', post.data.id]);
  assert.equal((await b.client.from('notifications').select('id').eq('post_id', post.data.id)).data.length, 0, 'draft does not notify');
  assert.ifError((await a.client.from('posts').update({ status: 'published' }).eq('id', post.data.id)).error);
  const postNotices = await b.client.from('notifications').select('id,kind,recipient_id').eq('post_id', post.data.id); assert.ifError(postNotices.error); assert.equal(postNotices.data.length, 1); assert.equal(postNotices.data[0].kind, 'mention');
  assert.equal((await c.client.from('notifications').select('id').eq('post_id', post.data.id)).data.length, 0, 'notifications are private');
  const forbiddenUpdate = await c.client.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', postNotices.data[0].id).select('id'); assert.ifError(forbiddenUpdate.error); assert.equal(forbiddenUpdate.data.length, 0, 'cannot mark another member notification');
  assert.ok((await c.client.from('notifications').insert({ recipient_id: b.id, actor_id: c.id, post_id: post.data.id, kind: 'mention' })).error, 'cannot forge notifications');
  const parent = await b.client.from('comments').insert({ post_id: post.data.id, user_id: b.id, content: `Ehi @${a.username}, ${tag}` }).select('id').single(); assert.ifError(parent.error);
  const adminNotice = await a.client.from('notifications').select('id,kind').eq('comment_id', parent.data.id); assert.ifError(adminNotice.error); assert.equal(adminNotice.data.length, 1); assert.equal(adminNotice.data[0].kind, 'mention');
  const detail = await (await fetch(`${app}/posts/${slug}`, { headers: { cookie: adminCookie } })).text(); assert.ok(detail.includes(`/members/${a.username}`), 'existing mention links to profile');
  const reply = await fetch(`${app}/posts/${slug}`, { method: 'POST', headers: { cookie: adminCookie }, body: form(action(detail, `value="${parent.data.id}"`), { post_id: post.data.id, slug, parent_id: parent.data.id, content: `Risposta @${b.username}` }), redirect: 'manual' }); assert.equal(reply.headers.get('location'), `/posts/${slug}`);
  const replies = await db.from('comments').select('id,parent_id').eq('post_id', post.data.id).eq('parent_id', parent.data.id); assert.ifError(replies.error); assert.equal(replies.data.length, 1);
  const replyNotice = await b.client.from('notifications').select('id,kind').eq('comment_id', replies.data[0].id); assert.ifError(replyNotice.error); assert.equal(replyNotice.data.length, 1, 'reply and mention do not duplicate'); assert.equal(replyNotice.data[0].kind, 'reply');
  const focused = await (await fetch(`${app}/posts/${slug}?page=9999&focus=${replies.data[0].id}`, { headers: { cookie: memberCookie } })).text(); assert.ok(focused.includes(`id="comment-${replies.data[0].id}"`), 'notification target remains reachable on another comment page');
  const otherPost = await a.client.from('posts').insert({ author_id: a.id, title: `Altro ${tag} @${c.username}`, slug: `other-${tag}`, content: 'Altro', category: 'news', status: 'published' }).select('id').single(); assert.ifError(otherPost.error); records.push(['posts', otherPost.data.id]);
  const titleNotice = await c.client.from('notifications').select('id').eq('post_id', otherPost.data.id); assert.ifError(titleNotice.error); assert.equal(titleNotice.data.length, 1, 'mention in post title notifies');
  assert.ok((await b.client.from('comments').insert({ post_id: otherPost.data.id, user_id: b.id, content: 'cross post', parent_id: parent.data.id })).error, 'reply cannot cross posts');
  const feed = await b.client.from('activity_feed').select('kind,title').eq('title', `Post ${tag}`); assert.ifError(feed.error); assert.ok(feed.data.some(item => item.kind === 'post')); assert.ok(feed.data.some(item => item.kind === 'comment'));
  const activityHtml = await (await fetch(`${app}/activity`, { headers: { cookie: memberCookie } })).text(); assert.ok(activityHtml.includes(`Post ${tag}`));
  const noticeHtml = await (await fetch(`${app}/notifications`, { headers: { cookie: memberCookie } })).text(); assert.ok(noticeHtml.includes(`Post ${tag}`)); assert.ok(noticeHtml.includes(`focus=${replies.data[0].id}#comment-${replies.data[0].id}`));
  const marked = await fetch(`${app}/notifications`, { method: 'POST', headers: { cookie: memberCookie }, body: form(action(noticeHtml, 'Segna tutte come lette'), {}), redirect: 'manual' }); assert.equal(marked.headers.get('location'), '/notifications');
  const unread = await b.client.from('notifications').select('id').eq('post_id', post.data.id).is('read_at', null); assert.ifError(unread.error); assert.equal(unread.data.length, 0);
  const poll = await a.client.rpc('create_poll', { question_text: `Sondaggio ${tag}`, option_labels: ['A', 'B'] }); assert.ifError(poll.error); records.push(['polls', poll.data]);
  const options = await a.client.from('poll_options').select('id,label').eq('poll_id', poll.data).order('position'); assert.ifError(options.error);
  assert.ifError((await b.client.from('poll_votes').insert({ poll_id: poll.data, option_id: options.data[0].id, user_id: b.id })).error);
  assert.ifError((await a.client.from('poll_votes').insert({ poll_id: poll.data, option_id: options.data[1].id, user_id: a.id })).error);
  assert.ifError((await a.client.from('polls').update({ closed: true }).eq('id', poll.data)).error);
  const quote = await b.client.from('quotes').insert({ submitted_by: b.id, content: `Citazione ${tag}`, speaker: 'Test' }).select('id').single(); assert.ifError(quote.error); records.push(['quotes', quote.data.id]);
  assert.ifError((await c.client.from('quote_votes').insert({ quote_id: quote.data.id, user_id: c.id })).error);
  const votes = await b.client.rpc('wrapped_vote_counts', { wrapped_year: year }).single(); assert.ifError(votes.error); assert.ok(votes.data.poll_votes >= 1); assert.ok(votes.data.quote_votes >= 1);
  assert.ifError((await db.from('quote_votes').update({ created_at: null }).eq('quote_id', quote.data.id).eq('user_id', c.id)).error);
  const legacy = await b.client.rpc('wrapped_vote_counts', { wrapped_year: year }).single(); assert.ifError(legacy.error); assert.equal(legacy.data.quote_votes, votes.data.quote_votes - 1); assert.equal(legacy.data.undated_votes, votes.data.undated_votes + 1);
  const winners = await b.client.rpc('wrapped_poll_winners', { wrapped_year: year }); assert.ifError(winners.error); assert.deepEqual(winners.data.filter(w => w.poll_id === poll.data).map(w => w.label), ['A', 'B']);
  const wrapped = await (await fetch(`${app}/wrapped?year=${year}`, { headers: { cookie: memberCookie } })).text(); assert.ok(wrapped.includes(`Sondaggio ${tag}`)); assert.ok(wrapped.includes('Voti registrati con data')); assert.ok(wrapped.includes('non sono attribuibili'));
  for (const path of ['/activity', '/notifications', '/wrapped']) assert.equal((await fetch(`${app}${path}`, { redirect: 'manual' })).headers.get('location'), '/login');
  assert.ifError((await a.client.from('posts').update({ status: 'draft' }).eq('id', post.data.id)).error);
  assert.equal((await b.client.from('activity_feed').select('id').eq('title', `Post ${tag}`)).data.length, 0, 'draft activity hidden');
  assert.equal((await b.client.from('notifications').select('id').eq('post_id', post.data.id)).data.length, 0, 'draft notifications hidden');
  console.log('PASS: replies, mentions, private notifications, activity feed and Wrapped');
} finally {
  for (const [table, id] of records) assert.ifError((await db.from(table).delete().eq('id', id)).error);
  for (const user of users) { assert.ifError((await db.from('profiles').delete().eq('id', user.id)).error); assert.ifError((await db.auth.admin.deleteUser(user.id)).error); }
}
