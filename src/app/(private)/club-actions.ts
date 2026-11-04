'use server';

import { redirect } from 'next/navigation';
import { requireAdmin, requireReadyMember } from '@/lib/auth';
import { isUuid } from '@/lib/posts';

export async function createPoll(form: FormData) {
  const { supabase } = await requireAdmin();
  const question = String(form.get('question') || '').trim();
  const options = String(form.get('options') || '').split(/\r?\n/).map(v => v.trim()).filter(Boolean);
  const date = String(form.get('closes_on') || '');
  if (!question || question.length > 200 || options.length < 2 || options.length > 6 || options.some(v => v.length > 120) || (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))) redirect('/polls?error=create');
  const { error } = await supabase.rpc('create_poll', { question_text: question, option_labels: options, closing_date: date || null });
  if (error) redirect('/polls?error=create');
  redirect('/polls?saved=1');
}

export async function vote(form: FormData) {
  const { supabase, profile } = await requireReadyMember();
  const poll = String(form.get('poll') || ''), option = String(form.get('option') || '');
  if (!isUuid(poll) || !isUuid(option)) redirect('/polls?error=vote');
  const { error } = await supabase.from('poll_votes').insert({ poll_id: poll, option_id: option, user_id: profile.id });
  if (error) redirect('/polls?error=vote');
  redirect('/polls?voted=1');
}

export async function closePoll(form: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(form.get('id') || '');
  if (!isUuid(id)) redirect('/polls?error=save');
  const { data, error } = await supabase.from('polls').update({ closed: true }).eq('id', id).select('id').maybeSingle();
  if (error || !data) redirect('/polls?error=save');
  redirect('/polls?saved=1');
}

export async function createRanking(form: FormData) {
  const { supabase } = await requireAdmin();
  const title = String(form.get('title') || '').trim();
  if (!title || title.length > 120) redirect('/rankings?error=save');
  const { error } = await supabase.from('rankings').insert({ title });
  if (error) redirect('/rankings?error=save');
  redirect('/rankings?saved=1');
}

export async function saveScore(form: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(form.get('ranking') || ''), name = String(form.get('name') || '').trim(), raw = String(form.get('points') || '').trim();
  const points = Number(raw);
  if (!isUuid(id) || !name || name.length > 80 || !/^-?\d+$/.test(raw) || !Number.isSafeInteger(points) || Math.abs(points) > 1000000) redirect('/rankings?error=save');
  const { error } = await supabase.from('ranking_entries').upsert({ ranking_id: id, name, points }, { onConflict: 'ranking_id,name' });
  if (error) redirect('/rankings?error=save');
  redirect('/rankings?saved=1');
}

export async function createEvent(form: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(form.get('id') || ''), title = String(form.get('title') || '').trim(), date = String(form.get('date') || ''), time = String(form.get('time') || ''), location = String(form.get('location') || '').trim(), description = String(form.get('description') || '').trim();
  if ((id && !isUuid(id)) || !title || title.length > 120 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || (time && !/^\d{2}:\d{2}$/.test(time)) || location.length > 160 || description.length > 2000) redirect('/events?error=save');
  const values = { title, event_date: date, event_time: time || null, location: location || null, description: description || null };
  const result = id ? await supabase.from('events').update(values).eq('id', id).select('id').maybeSingle() : await supabase.from('events').insert(values).select('id').maybeSingle();
  if (result.error || !result.data) redirect('/events?error=save');
  redirect('/events?saved=1');
}

export async function deleteClubItem(form: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(form.get('id') || ''), kind = String(form.get('kind') || '');
  const routes: Record<string, string> = { polls: '/polls', rankings: '/rankings', ranking_entries: '/rankings', events: '/events' };
  const route = routes[kind];
  if (!route || !isUuid(id)) redirect('/');
  const { data, error } = await supabase.from(kind).delete().eq('id', id).select('id').maybeSingle();
  if (error || !data) redirect(`${route}?error=delete`);
  redirect(`${route}?saved=1`);
}
