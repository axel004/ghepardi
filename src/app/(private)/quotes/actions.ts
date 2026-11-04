'use server';
import { redirect } from 'next/navigation';
import { requireReadyMember } from '@/lib/auth';
import { isUuid } from '@/lib/posts';

export async function createQuote(form: FormData) {
  const { supabase, profile } = await requireReadyMember();
  const content = String(form.get('content') || '').trim(), speaker = String(form.get('speaker') || '').trim();
  if (!content || content.length > 1000 || !speaker || speaker.length > 80) redirect('/quotes?error=save');
  const { error } = await supabase.from('quotes').insert({ content, speaker, submitted_by: profile.id });
  if (error) redirect('/quotes?error=save');
  redirect('/quotes?saved=1');
}
export async function voteQuote(form: FormData) {
  const { supabase, profile } = await requireReadyMember();
  const id = String(form.get('id') || ''), operation = String(form.get('operation') || '');
  if (!isUuid(id) || !['add', 'remove'].includes(operation)) redirect('/quotes?error=vote');
  const { error } = operation === 'add' ? await supabase.from('quote_votes').insert({ quote_id: id, user_id: profile.id }) : await supabase.from('quote_votes').delete().eq('quote_id', id).eq('user_id', profile.id);
  if (error) redirect('/quotes?error=vote');
  redirect('/quotes');
}
export async function deleteQuote(form: FormData) {
  const { supabase } = await requireReadyMember();
  const id = String(form.get('id') || '');
  if (!isUuid(id)) redirect('/quotes?error=delete');
  const { data, error } = await supabase.from('quotes').delete().eq('id', id).select('id').maybeSingle();
  if (error || !data) redirect('/quotes?error=delete');
  redirect('/quotes?saved=1');
}
