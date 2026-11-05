import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { isUuid } from '@/lib/posts';
import { PostForm } from '../post-form';
import { Back, Head, Notice, Screen, Slide } from '@/components/ui';

export default async function EditPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { supabase } = await requireAdmin(), { id } = await params;
  if (!isUuid(id)) notFound();
  const { data: post, error } = await supabase.from('posts').select('id,title,slug,content,category,status,cover_photo_id').eq('id', id).maybeSingle();
  if (error) throw new Error('Impossibile caricare il post');
  if (!post) notFound();
  return (
    <Screen>
      <Back href="/admin/posts">I post</Back>
      <Head title="Modifica post" />
      <p className="pager"><Link href={`/posts/${post.slug}`} className="btn ghost">Vedi anteprima</Link><Link href={`/admin/posts/${post.id}/delete`} className="btn ghost">Elimina post</Link></p>
      {(await searchParams).error && <Notice kind="err">Controlla i dati e riprova.</Notice>}
      <Slide shape="a" tone="light"><PostForm post={post} /></Slide>
    </Screen>
  );
}
