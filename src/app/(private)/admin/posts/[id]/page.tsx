import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { isUuid } from '@/lib/posts';
import { PostForm } from '../post-form';
export default async function EditPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { supabase } = await requireAdmin(), { id } = await params;
  if (!isUuid(id)) notFound();
  const { data: post, error } = await supabase.from('posts').select('id,title,slug,content,category,status').eq('id', id).maybeSingle();
  if (error) throw new Error('Impossibile caricare il post');
  if (!post) notFound();
  return <main className="panel"><p className="eyebrow">🐆 GHEPARDI</p><h1>Modifica post</h1><p><Link href={`/posts/${post.slug}`}>Vedi anteprima</Link></p>{(await searchParams).error && <p className="error" role="alert">Controlla i dati e riprova.</p>}<PostForm post={post} /><p><Link href={`/admin/posts/${post.id}/delete`}>Elimina post</Link></p><p><Link href="/admin/posts">← I post</Link></p></main>;
}
