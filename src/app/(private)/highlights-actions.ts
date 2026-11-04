'use server';

import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { isUuid } from '@/lib/posts';

const routes: Record<string, string> = { monthly: '/monthly', awards: '/awards', fame: '/hall-of-fame', shame: '/hall-of-shame' };

export async function saveHighlight(form: FormData) {
  const { supabase } = await requireAdmin();
  const kind = String(form.get('kind') || ''), id = String(form.get('id') || '');
  const route = Object.hasOwn(routes, kind) ? routes[kind] : undefined;
  if (!route) redirect('/');
  const back = id && isUuid(id) ? `${route}?edit=${id}&error=save` : `${route}?error=save`;
  const title = String(form.get('title') || '').trim(), description = String(form.get('description') || '').trim();
  const photo = String(form.get('photo_id') || ''), subject = String(form.get('subject') || '').trim(), member = String(form.get('member_id') || '');
  const month = String(form.get('month') || ''), year = String(form.get('year') || '');
  if ((id && !isUuid(id)) || !title || title.length > 120 || description.length > 2000 || (photo && !isUuid(photo))) redirect(back);
  if (kind === 'monthly' && (!/^(19\d\d|20\d\d|2100)-(0[1-9]|1[0-2])$/.test(month) || !subject || subject.length > 120)) redirect(back);
  if (kind !== 'monthly' && (!/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > 2100)) redirect(back);
  if (kind === 'awards' && !isUuid(member)) redirect(back);
  const table = kind === 'monthly' ? 'monthly_features' : kind === 'awards' ? 'awards' : 'hall_entries';
  const values: Record<string, string | number | null> = kind === 'monthly' ? { title, description: description || null, feature_month: `${month}-01`, subject, photo_id: photo || null } : kind === 'awards' ? { title, description: description || null, award_year: Number(year), member_id: member } : { title, description: description || null, entry_year: Number(year), hall: kind, photo_id: photo || null };
  const result = id ? await supabase.from(table).update(values).eq('id', id).select('id').maybeSingle() : await supabase.from(table).insert(values).select('id').maybeSingle();
  if (result.error || !result.data) redirect(back);
  redirect(`${route}?saved=1`);
}

export async function deleteHighlight(form: FormData) {
  const { supabase } = await requireAdmin();
  const kind = String(form.get('kind') || ''), id = String(form.get('id') || ''), route = Object.hasOwn(routes, kind) ? routes[kind] : undefined;
  if (!route || !isUuid(id)) redirect('/');
  const table = kind === 'monthly' ? 'monthly_features' : kind === 'awards' ? 'awards' : 'hall_entries';
  let query = supabase.from(table).delete().eq('id', id);
  if (kind === 'fame' || kind === 'shame') query = query.eq('hall', kind);
  const { data, error } = await query.select('id').maybeSingle();
  if (error || !data) redirect(`${route}?error=delete`);
  redirect(`${route}?deleted=1`);
}
