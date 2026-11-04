import Link from 'next/link';
import { requireReadyMember } from '@/lib/auth';
import { pageNumber } from '@/lib/posts';

export default async function Gallery({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { supabase, profile } = await requireReadyMember();
  const page = pageNumber((await searchParams).page);
  const { data: albums, error } = await supabase.from('albums').select('id,title,event_date').order('event_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20);
  return <main className="panel"><p><Link href="/">← Home</Link></p><p className="eyebrow">🐆 GHEPARDI</p><h1>Gallery</h1><p>Le foto del branco, tutte qui.</p>{profile.role === 'admin' && <p><Link href="/admin/gallery">📸 Gestisci la gallery</Link></p>}
    {error ? <p className="error">Impossibile caricare gli album. Riprova.</p> : !albums?.length ? <p>Non ci sono ancora album.</p> : albums.slice(0, 20).map((album) => <article className="post-card" key={album.id}><h2><Link href={`/gallery/${album.id}`}>{album.title}</Link></h2>{album.event_date && <p>{album.event_date.split('-').reverse().join('/')}</p>}</article>)}
    <nav className="pagination" aria-label="Pagine degli album">{page > 1 && <Link href={`/gallery?page=${page - 1}`}>← Precedenti</Link>}{albums && albums.length > 20 && <Link href={`/gallery?page=${page + 1}`}>Successivi →</Link>}</nav></main>;
}
