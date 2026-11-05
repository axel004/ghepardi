/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
import { requireReadyMember } from '@/lib/auth';
import { pageNumber } from '@/lib/posts';
import { Empty, Head, Icon, Pager, Row, Screen, Slide, dateIt } from '@/components/ui';

export const metadata = { title: 'Gallery' };

export default async function Gallery({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { supabase, profile } = await requireReadyMember();
  const page = pageNumber((await searchParams).page);
  const { data: albums, error } = await supabase.from('albums').select('id,title,event_date,photos(id,created_at)').order('event_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).order('id', { ascending: false }).order('created_at', { referencedTable: 'photos', ascending: false }).limit(1, { referencedTable: 'photos' }).range((page - 1) * 20, page * 20);
  const shown = albums?.slice(0, 20) ?? [];
  return (
    <Screen>
      <Head title="Gallery" tick={<Icon name="lock" />}>Le foto del branco. Private: le vedono solo i membri.</Head>
      {profile.role === 'admin' && <p className="pager"><Link href="/admin/gallery" className="btn" transitionTypes={['nav-forward']}>Gestisci la gallery</Link></p>}
      {error ? <Empty title="Non si carica">Impossibile caricare gli album. Riprova.</Empty>
        : !shown.length ? <Empty title="Nessun album">Non ci sono ancora album.</Empty>
        : <Slide shape="c">{shown.map(album => (
          <Row key={album.id} href={`/gallery/${album.id}`} title={album.title} sub={album.event_date ? dateIt(album.event_date) : undefined}
            when={album.photos?.[0] ? <img src={`/media/${album.photos[0].id}?size=thumb`} alt="" width={64} height={48} loading="lazy" style={{ width: 64, height: 48, objectFit: 'cover' }} /> : 'Vuoto'} />
        ))}</Slide>}
      <Pager prev={page > 1 ? `/gallery?page=${page - 1}` : undefined} next={albums && albums.length > 20 ? `/gallery?page=${page + 1}` : undefined} prevLabel="Precedenti" nextLabel="Successivi" />
    </Screen>
  );
}
