'use server';

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin, requireReadyMember } from '@/lib/auth';
import { categories, emojis, isUuid } from '@/lib/posts';

export async function savePost(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  const id = String(formData.get('id') || '');
  const title = String(formData.get('title') || '').trim();
  const content = String(formData.get('content') || '').trim();
  const category = String(formData.get('category') || '');
  const status = String(formData.get('status') || '');
  const cover = String(formData.get('cover_photo_id') || '');
  const back = id && isUuid(id) ? `/admin/posts/${id}` : '/admin/posts/new';
  if ((id && !isUuid(id)) || (cover && !isUuid(cover)) || !title || title.length > 160 || !content || content.length > 50000 || !categories.some((x) => x === category) || !['draft', 'published'].includes(status)) redirect(`${back}?error=validation`);
  let error;
  if (id) {
    const result = await supabase.from('posts').update({ title, content, category, status, cover_photo_id: cover || null }).eq('id', id).select('id').maybeSingle();
    error = result.error || !result.data;
  } else {
    const newId = randomUUID();
    const base = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 140).replace(/-+$/, '') || 'post';
    const result = await supabase.from('posts').insert({ id: newId, author_id: profile.id, title, slug: `${base}-${newId}`, content, category, status, cover_photo_id: cover || null });
    error = result.error;
  }
  if (error) redirect(`${back}?error=save`);
  revalidatePath('/');
  redirect('/admin/posts?saved=1');
}

export async function deletePost(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id') || '');
  if (!isUuid(id)) redirect('/admin/posts?error=delete');
  const { data, error } = await supabase.from('posts').delete().eq('id', id).select('id').maybeSingle();
  if (error || !data) redirect('/admin/posts?error=delete');
  revalidatePath('/');
  redirect('/admin/posts?deleted=1');
}

export async function addComment(formData: FormData) {
  const { supabase, profile } = await requireReadyMember();
  const postId = String(formData.get('post_id') || '');
  const slug = String(formData.get('slug') || '');
  const content = String(formData.get('content') || '').trim();
  const parent = String(formData.get('parent_id') || '');
  if (!isUuid(postId) || !/^[a-z0-9-]{1,180}$/.test(slug)) redirect('/');
  if (!content || content.length > 2000 || (parent && !isUuid(parent))) redirect(`/posts/${slug}?error=comment`);
  const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: profile.id, content, parent_id: parent || null });
  if (error) redirect(`/posts/${slug}?error=comment`);
  revalidatePath(`/posts/${slug}`);
  redirect(`/posts/${slug}`);
}

export async function deleteComment(formData: FormData) {
  const { supabase } = await requireReadyMember();
  const id = String(formData.get('id') || ''), slug = String(formData.get('slug') || '');
  if (!isUuid(id) || !/^[a-z0-9-]{1,180}$/.test(slug)) redirect('/');
  const { data, error } = await supabase.from('comments').delete().eq('id', id).select('id').maybeSingle();
  if (error || !data) redirect(`/posts/${slug}?error=delete`);
  revalidatePath(`/posts/${slug}`);
  redirect(`/posts/${slug}`);
}

export async function reactToPost(formData: FormData) {
  const { supabase, profile } = await requireReadyMember();
  const postId = String(formData.get('post_id') || ''), slug = String(formData.get('slug') || ''), emoji = String(formData.get('emoji') || ''), operation = String(formData.get('operation') || '');
  if (!isUuid(postId) || !/^[a-z0-9-]{1,180}$/.test(slug) || !emojis.some((x) => x === emoji) || !['add', 'remove'].includes(operation)) redirect('/');
  const query = supabase.from('post_reactions');
  const { error } = operation === 'add' ? await query.insert({ post_id: postId, user_id: profile.id, emoji }) : await query.delete().eq('post_id', postId).eq('user_id', profile.id).eq('emoji', emoji);
  if (error) redirect(`/posts/${slug}?error=reaction`);
  revalidatePath(`/posts/${slug}`);
  redirect(`/posts/${slug}`);
}
