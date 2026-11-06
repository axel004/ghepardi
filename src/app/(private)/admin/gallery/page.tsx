import { requireAdmin } from '@/lib/auth';
import { pageNumber } from '@/lib/posts';
import { createAlbum } from '../../gallery/actions';
import { Back, Empty, Head, Notice, Pager, Row, Screen, Slide, dateIt } from '@/components/ui';
import { Submit } from '@/components/submit';

export default async function AdminGallery({ searchParams }: { searchParams: Promise<{ page?: string; error?: string; deleted?: string }> }) {
  const { supabase } = await requireAdmin(), query = await searchParams, page = pageNumber(query.page);
  const { data: albums, error } = await supabase.from('albums').select('id,title,event_date').order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20);
  return (
    <Screen>
      <Back href="/admin">Pannello admin</Back>
      <Head title="Gestisci gallery" />
      <Slide title="Nuovo album" shape="b" tone="light">
        <form action={createAlbum} className="form">
          <label htmlFor="title">Nome dell’album</label><input id="title" name="title" required maxLength={120} placeholder="Es. Vacanze al mare" />
          <label htmlFor="event_date">Data <small>(facoltativa)</small></label><input id="event_date" name="event_date" type="date" />
          <div className="btn-row"><Submit>Crea album</Submit></div>
        </form>
      </Slide>
      {query.error && <Notice kind="err">Impossibile creare l’album. Controlla i dati e riprova.</Notice>}
      {query.deleted && <Notice>Album eliminato.</Notice>}
      {error ? <Empty title="Non si carica">Impossibile caricare gli album.</Empty>
        : !albums?.length ? <Empty title="Nessun album">Non ci sono ancora album.</Empty>
        : <Slide title="I tuoi album" shape="a">{albums.slice(0, 20).map(album => <Row key={album.id} href={`/admin/gallery/${album.id}`} when="Album" title={album.title} sub={album.event_date ? dateIt(album.event_date) : undefined} />)}</Slide>}
      <Pager prev={page > 1 ? `/admin/gallery?page=${page - 1}` : undefined} next={albums && albums.length > 20 ? `/admin/gallery?page=${page + 1}` : undefined} prevLabel="Precedenti" nextLabel="Successivi" />
    </Screen>
  );
}
