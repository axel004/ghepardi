import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { pageNumber } from '@/lib/posts';
import { createAlbum } from '../../gallery/actions';

export default async function AdminGallery({ searchParams }: { searchParams: Promise<{ page?: string; error?: string; deleted?: string }> }) {
  const { supabase } = await requireAdmin(), query = await searchParams, page = pageNumber(query.page);
  const { data: albums, error } = await supabase.from('albums').select('id,title,event_date').order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20);
  return <main className="panel"><p><Link href="/admin">← Pannello admin</Link></p><h1>Gestisci gallery</h1><h2>Nuovo album</h2><form action={createAlbum} className="form"><label htmlFor="title">Nome dell’album</label><input id="title" name="title" required maxLength={120} placeholder="Es. Vacanze al mare" /><label htmlFor="event_date">Data <small>(facoltativa)</small></label><input id="event_date" name="event_date" type="date" /><button>Crea album</button></form>
    {query.error && <p className="error" role="alert">Impossibile creare l’album. Controlla i dati e riprova.</p>}{query.deleted && <p role="status">Album eliminato.</p>}<h2>I tuoi album</h2>
    {error ? <p className="error">Impossibile caricare gli album.</p> : !albums?.length ? <p>Non ci sono ancora album.</p> : albums.slice(0, 20).map((album) => <article className="post-card" key={album.id}><h2><Link href={`/admin/gallery/${album.id}`}>{album.title}</Link></h2></article>)}
    <nav className="pagination" aria-label="Pagine degli album">{page > 1 && <Link href={`/admin/gallery?page=${page - 1}`}>← Precedenti</Link>}{albums && albums.length > 20 && <Link href={`/admin/gallery?page=${page + 1}`}>Successivi →</Link>}</nav></main>;
}
