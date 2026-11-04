'use server';

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { isUuid } from '@/lib/posts';

export async function createAlbum(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  const title = String(formData.get('title') || '').trim();
  const date = String(formData.get('event_date') || '');
  if (!title || title.length > 120 || (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))) redirect('/admin/gallery?error=album');
  const id = randomUUID();
  const { error } = await supabase.from('albums').insert({ id, title, event_date: date || null, created_by: profile.id });
  if (error) redirect('/admin/gallery?error=album');
  revalidatePath('/gallery');
  redirect(`/admin/gallery/${id}`);
}

export async function deletePhoto(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id') || ''), albumId = String(formData.get('album_id') || '');
  if (!isUuid(id) || !isUuid(albumId)) redirect('/admin/gallery');
  const { data: photo, error } = await supabase.from('photos').select('id,storage_path').eq('id', id).eq('album_id', albumId).maybeSingle();
  if (error || !photo) redirect(`/admin/gallery/${albumId}?error=delete`);
  const removed = await supabase.storage.from('ghepardi-gallery').remove([photo.storage_path]);
  if (removed.error) redirect(`/admin/gallery/${albumId}?error=delete`);
  const deleted = await supabase.from('photos').delete().eq('id', id).select('id').maybeSingle();
  if (deleted.error || !deleted.data) redirect(`/admin/gallery/${albumId}?error=delete`);
  revalidatePath('/gallery');
  revalidatePath('/');
  redirect(`/admin/gallery/${albumId}?deleted=1`);
}

export async function deleteAlbum(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id') || '');
  if (!isUuid(id)) redirect('/admin/gallery');
  const { data, error } = await supabase.from('albums').delete().eq('id', id).select('id').maybeSingle();
  if (error || !data) redirect(`/admin/gallery/${id}?error=album-delete`);
  revalidatePath('/gallery');
  redirect('/admin/gallery?deleted=1');
}
