/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { isUuid, pageNumber } from '@/lib/posts';
import { UploadForm } from '../upload-form';
import { Back, Empty, Head, Notice, Pager, Screen, Slide } from '@/components/ui';

export default async function AdminAlbum({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string; error?: string; deleted?: string }> }) {
  const { supabase } = await requireAdmin(), { id } = await params, query = await searchParams;
  if (!isUuid(id)) notFound();
  const album = await supabase.from('albums').select('id,title').eq('id', id).maybeSingle();
  if (album.error) throw new Error('Impossibile caricare l’album');
  if (!album.data) notFound();
  const albumTitle = album.data.title;
  const page = pageNumber(query.page);
  const photos = await supabase.from('photos').select('id,caption').eq('album_id', id).order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 24, page * 24);
  return (
    <Screen>
      <Back href="/admin/gallery">Tutti gli album</Back>
      <Head title={albumTitle} />
      <p className="pager"><Link href={`/gallery/${id}`} className="btn ghost">Vedi l’album</Link><Link href={`/admin/gallery/${id}/delete`} className="btn ghost">Elimina album vuoto</Link></p>
      <Slide title="Carica foto" shape="b" tone="light"><UploadForm albumId={id} /></Slide>
      {query.error && <Notice kind="err">{query.error === 'album-delete' ? 'Per eliminare l’album, rimuovi prima tutte le foto.' : 'Impossibile eliminare la foto. Riprova.'}</Notice>}
      {query.deleted && <Notice>Foto eliminata.</Notice>}
      {photos.error ? <Empty title="Non si carica">Impossibile caricare le foto.</Empty>
        : !photos.data?.length ? <Empty title="Album vuoto">Questo album è ancora vuoto.</Empty>
        : <div className="photos">{photos.data.slice(0, 24).map(photo => (
          <div key={photo.id} style={{ breakInside: 'avoid', marginBottom: 8 }}>
            <img src={`/media/${photo.id}?size=thumb`} alt={photo.caption || `Foto di ${albumTitle}`} loading="lazy" style={{ width: '100%' }} />
            <Link className="btn ghost" style={{ width: '100%', marginTop: 4 }} href={`/admin/gallery/${id}/photo/${photo.id}/delete`}>Elimina foto</Link>
          </div>
        ))}</div>}
      <Pager prev={page > 1 ? `/admin/gallery/${id}?page=${page - 1}` : undefined} next={photos.data && photos.data.length > 24 ? `/admin/gallery/${id}?page=${page + 1}` : undefined} prevLabel="Precedenti" nextLabel="Successive" />
    </Screen>
  );
}
