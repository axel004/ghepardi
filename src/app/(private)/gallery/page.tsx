/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
import { ViewTransition } from 'react';
import { requireReadyMember } from '@/lib/auth';
import { pageNumber } from '@/lib/posts';
import { Empty, Head, Icon, Pager, Screen, dateIt } from '@/components/ui';

export const metadata = { title: 'Gallery' };

export default async function Gallery({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { supabase, profile } = await requireReadyMember();
  const page = pageNumber((await searchParams).page);
  const { data: albums, error } = await supabase.from('albums').select('id,title,event_date,photos(id,created_at)').order('event_date', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).order('id', { ascending: false }).order('created_at', { referencedTable: 'photos', ascending: false }).limit(1, { referencedTable: 'photos' }).range((page - 1) * 20, page * 20);
  const shown = albums?.slice(0, 20) ?? [];
  return (
    <Screen>
      <Head title="Gallery" tick={<Icon name="lock" />}>Le foto del branco. Private: le vedono solo i membri.</Head>
      {profile.role === 'admin' && <p className="pager"><Link href="/admin/gallery" className="btn ghost" transitionTypes={['nav-forward']}>Gestisci la gallery</Link></p>}
      {error ? <Empty title="Non si carica">Impossibile caricare gli album. Riprova.</Empty>
        : !shown.length ? <Empty title="Ancora nessun album">Le foto migliori sono ancora nei telefoni di qualcuno.</Empty>
        : <div>{shown.map(album => (
          <Link key={album.id} className="album" href={`/gallery/${album.id}`} transitionTypes={['nav-forward']}>
            {album.photos?.[0]
              ? <ViewTransition name={`album-${album.id}`}><img src={`/media/${album.photos[0].id}?size=thumb`} alt="" loading="lazy" /></ViewTransition>
              : <span className="empty-cover lbl">Album vuoto</span>}
            <span className="cap"><b>{album.title}</b>{album.event_date && <span className="meta">{dateIt(album.event_date)}</span>}</span>
          </Link>
        ))}</div>}
      <Pager prev={page > 1 ? `/gallery?page=${page - 1}` : undefined} next={albums && albums.length > 20 ? `/gallery?page=${page + 1}` : undefined} prevLabel="Precedenti" nextLabel="Successivi" />
    </Screen>
  );
}
