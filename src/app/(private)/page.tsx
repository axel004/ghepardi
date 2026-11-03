import { redirect } from 'next/navigation';
import { logout } from '@/app/actions';
import { requireReadyMember } from '@/lib/auth';
import Link from 'next/link';
import { pageNumber } from '@/lib/posts';
export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { profile, supabase } = await requireReadyMember();
  if (!profile.username || !profile.display_name) redirect('/profile');
  const page = pageNumber((await searchParams).page);
  const { data: posts, error } = await supabase.from('posts').select('id, title, slug, content, category, published_at').eq('status', 'published').order('published_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20);
  return <main className="panel"><div className="brand">🐆</div><p className="eyebrow">PRIVATE MEMBERS CLUB</p><h1>Ciao {profile.display_name}.</h1><p>Le ultime dal branco.</p>{profile.role === 'admin' && <p><Link href="/admin">⚙️ Pannello admin</Link></p>}
    {error ? <p className="error">Impossibile caricare i post. Riprova.</p> : !posts?.length ? <p>Ancora nessun post. Il primo ricordo aspetta solo voi.</p> : posts.slice(0, 20).map((post) => <article className="post-card" key={post.id}><p className="eyebrow">{post.category}</p><h2><Link href={`/posts/${post.slug}`}>{post.title}</Link></h2><p className="excerpt">{post.content}</p><Link href={`/posts/${post.slug}`}>Leggi e commenta →</Link></article>)}
    <nav className="pagination" aria-label="Pagine dei post">{page > 1 && <Link href={`/?page=${page - 1}`}>← Più recenti</Link>}{posts && posts.length > 20 && <Link href={`/?page=${page + 1}`}>Più vecchi →</Link>}</nav><form action={logout}><button className="secondary">Esci</button></form></main>;
}
