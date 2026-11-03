import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { pageNumber } from '@/lib/posts';

export default async function AdminPosts({ searchParams }: { searchParams: Promise<{ page?: string; error?: string; saved?: string; deleted?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams, page = pageNumber(params.page);
  const { data: posts, error } = await supabase.from('posts').select('id, title, status').order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20);
  return <main className="panel"><p className="eyebrow">🐆 GHEPARDI</p><h1>I post</h1><p><Link href="/admin/posts/new">+ Scrivi un post</Link></p>
    {params.saved && <p role="status">Post salvato.</p>}{params.deleted && <p role="status">Post eliminato.</p>}{(error || params.error) && <p className="error" role="alert">Operazione non riuscita. Riprova.</p>}
    {!error && !posts?.length && <p>Non ci sono ancora post.</p>}{posts?.slice(0, 20).map((post) => <article className="post-card" key={post.id}><h2><Link href={`/admin/posts/${post.id}`}>{post.title}</Link></h2><p>{post.status === 'published' ? 'Pubblicato' : 'Bozza'}</p></article>)}
    <nav className="pagination" aria-label="Pagine dei post">{page > 1 && <Link href={`/admin/posts?page=${page - 1}`}>← Precedenti</Link>}{posts && posts.length > 20 && <Link href={`/admin/posts?page=${page + 1}`}>Successivi →</Link>}</nav><p><Link href="/admin">← Pannello admin</Link></p></main>;
}
