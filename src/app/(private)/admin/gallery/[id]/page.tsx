/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { isUuid, pageNumber } from '@/lib/posts';
import { UploadForm } from '../upload-form';

export default async function AdminAlbum({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string; error?: string; deleted?: string }> }) {
  const { supabase } = await requireAdmin(), { id } = await params, query = await searchParams;
  if (!isUuid(id)) notFound();
  const album = await supabase.from('albums').select('id,title').eq('id', id).maybeSingle();
  if (album.error) throw new Error('Impossibile caricare l’album');
  if (!album.data) notFound();
  const albumTitle = album.data.title;
  const page = pageNumber(query.page);
  const photos = await supabase.from('photos').select('id,caption').eq('album_id', id).order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 24, page * 24);
  return <main className="panel"><p><Link href="/admin/gallery">← Tutti gli album</Link></p><h1>{album.data.title}</h1><p><Link href={`/gallery/${id}`}>Vedi l’album</Link></p><UploadForm albumId={id} />
    {query.error && <p className="error" role="alert">{query.error === 'album-delete' ? 'Per eliminare l’album, rimuovi prima tutte le foto.' : 'Impossibile eliminare la foto. Riprova.'}</p>}{query.deleted && <p role="status">Foto eliminata.</p>}
    {photos.error ? <p className="error">Impossibile caricare le foto.</p> : !photos.data?.length ? <p>Questo album è ancora vuoto.</p> : <div className="photo-grid">{photos.data.slice(0, 24).map((photo) => <div key={photo.id}><img src={`/media/${photo.id}?size=thumb`} alt={photo.caption || `Foto di ${albumTitle}`} loading="lazy" /><Link href={`/admin/gallery/${id}/photo/${photo.id}/delete`}>Elimina foto</Link></div>)}</div>}
    <nav className="pagination" aria-label="Pagine delle foto">{page > 1 && <Link href={`/admin/gallery/${id}?page=${page - 1}`}>← Precedenti</Link>}{photos.data && photos.data.length > 24 && <Link href={`/admin/gallery/${id}?page=${page + 1}`}>Successive →</Link>}</nav><p><Link href={`/admin/gallery/${id}/delete`}>Elimina album vuoto</Link></p></main>;
}
