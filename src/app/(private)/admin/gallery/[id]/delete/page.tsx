import { Back, Head, Screen } from '@/components/ui';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { isUuid } from '@/lib/posts';
import { deleteAlbum } from '../../../../gallery/actions';

export default async function ConfirmDeleteAlbum({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin(), { id } = await params;
  if (!isUuid(id)) notFound();
  const album = await supabase.from('albums').select('id,title').eq('id', id).maybeSingle();
  if (album.error) throw new Error('Impossibile caricare l’album');
  if (!album.data) notFound();
  return (
    <Screen>
      <Back href={`/admin/gallery/${id}`}>Annulla</Back>
      <Head title="Eliminare l’album?" />
      <article className="pane"><p className="prose">Puoi eliminare “{album.data.title}” solo se è vuoto.</p>
        <form action={deleteAlbum}><input type="hidden" name="id" value={id} /><div className="btn-row"><button className="btn">Elimina album</button></div></form></article>
    </Screen>
  );

}
