/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireReadyMember } from '@/lib/auth';
import { isUuid, pageNumber } from '@/lib/posts';
import { Back, Empty, Head, Pager, Screen, dateIt } from '@/components/ui';

export default async function Album({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }) {
  const { supabase, profile } = await requireReadyMember(), { id } = await params;
  if (!isUuid(id)) notFound();
  const { data: album, error } = await supabase.from('albums').select('id,title,event_date').eq('id', id).maybeSingle();
  if (error) throw new Error('Impossibile caricare l’album');
  if (!album) notFound();
  const page = pageNumber((await searchParams).page);
  const photos = await supabase.from('photos').select('id,caption').eq('album_id', id).order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 24, page * 24);
  return (
    <Screen>
      <Back href="/gallery">Gallery</Back>
      <Head title={album.title} tick={album.event_date ? dateIt(album.event_date) : undefined} />
      {profile.role === 'admin' && <p className="pager"><Link href={`/admin/gallery/${id}`} className="btn ghost">Aggiungi o gestisci foto</Link></p>}
      {photos.error ? <Empty title="Non si carica">Impossibile caricare le foto.</Empty>
        : !photos.data?.length ? <Empty title="Album vuoto">Questo album è ancora vuoto.</Empty>
        : <div className="photos">{photos.data.slice(0, 24).map(photo => (
          <a key={photo.id} href={`/media/${photo.id}`} target="_blank" rel="noreferrer" aria-label={photo.caption || `Apri foto di ${album.title}`}>
            <img src={`/media/${photo.id}?size=thumb`} alt={photo.caption || `Foto di ${album.title}`} loading="lazy" />
          </a>
        ))}</div>}
      <Pager prev={page > 1 ? `/gallery/${id}?page=${page - 1}` : undefined} next={photos.data && photos.data.length > 24 ? `/gallery/${id}?page=${page + 1}` : undefined} prevLabel="Precedenti" nextLabel="Successive" />
    </Screen>
  );
}
