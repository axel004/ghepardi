/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireReadyMember } from '@/lib/auth';
import { isUuid, pageNumber } from '@/lib/posts';

export default async function Album({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }) {
  const { supabase, profile } = await requireReadyMember(), { id } = await params;
  if (!isUuid(id)) notFound();
  const { data: album, error } = await supabase.from('albums').select('id,title,event_date').eq('id', id).maybeSingle();
  if (error) throw new Error('Impossibile caricare l’album');
  if (!album) notFound();
  const page = pageNumber((await searchParams).page);
  const photos = await supabase.from('photos').select('id,caption').eq('album_id', id).order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 24, page * 24);
  return <main className="panel"><p><Link href="/gallery">← Gallery</Link></p><h1>{album.title}</h1>{album.event_date && <p>{album.event_date.split('-').reverse().join('/')}</p>}{profile.role === 'admin' && <p><Link href={`/admin/gallery/${id}`}>Aggiungi o gestisci foto</Link></p>}
    {photos.error ? <p className="error">Impossibile caricare le foto.</p> : !photos.data?.length ? <p>Questo album è ancora vuoto.</p> : <div className="photo-grid">{photos.data.slice(0, 24).map((photo) => <a key={photo.id} href={`/media/${photo.id}`} target="_blank" rel="noreferrer"><img src={`/media/${photo.id}?size=thumb`} alt={photo.caption || `Foto di ${album.title}`} loading="lazy" /></a>)}</div>}
    <nav className="pagination" aria-label="Pagine delle foto">{page > 1 && <Link href={`/gallery/${id}?page=${page - 1}`}>← Precedenti</Link>}{photos.data && photos.data.length > 24 && <Link href={`/gallery/${id}?page=${page + 1}`}>Successive →</Link>}</nav></main>;
}
