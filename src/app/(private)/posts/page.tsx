/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
import { requireReadyMember } from '@/lib/auth';
import { pageNumber } from '@/lib/posts';

export default async function Posts({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { supabase, profile } = await requireReadyMember();
  const page = pageNumber((await searchParams).page);
  const { data: posts, error } = await supabase.from('posts').select('id,title,slug,content,category,cover_photo_id').eq('status', 'published').order('published_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20);
  return <main className="panel section-panel"><p className="eyebrow">📰 LE STORIE DEL BRANCO</p><h1>Post</h1><p>Cronache, meme e momenti da ricordare.</p>{profile.role === 'admin' && <p><Link href="/admin/posts/new">+ Scrivi un post</Link></p>}
    {error ? <p className="error">Impossibile caricare i post. Riprova.</p> : !posts?.length ? <p>Ancora nessun post. Il primo ricordo aspetta solo voi.</p> : posts.slice(0, 20).map((post) => <article className="post-card" key={post.id}><p className="eyebrow">{post.category}</p><h2><Link href={`/posts/${post.slug}`}>{post.title}</Link></h2>{post.cover_photo_id && <Link href={`/posts/${post.slug}`}><img className="post-image" src={`/media/${post.cover_photo_id}?size=thumb`} alt={`Copertina: ${post.title}`} loading="lazy" /></Link>}<p className="excerpt">{post.content}</p><Link href={`/posts/${post.slug}`}>Leggi e commenta →</Link></article>)}
    <nav className="pagination" aria-label="Pagine dei post">{page > 1 && <Link href={`/posts?page=${page - 1}`}>← Più recenti</Link>}{posts && posts.length > 20 && <Link href={`/posts?page=${page + 1}`}>Più vecchi →</Link>}</nav></main>;
}
