/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import { Back, Head, Screen } from '@/components/ui';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { isUuid } from '@/lib/posts';
import { deletePhoto } from '../../../../../../gallery/actions';

export default async function ConfirmDeletePhoto({ params }: { params: Promise<{ id: string; photoId: string }> }) {
  const { supabase } = await requireAdmin(), { id, photoId } = await params;
  if (!isUuid(id) || !isUuid(photoId)) notFound();
  const photo = await supabase.from('photos').select('id').eq('id', photoId).eq('album_id', id).maybeSingle();
  if (photo.error) throw new Error('Impossibile caricare la foto');
  if (!photo.data) notFound();
  return (
    <Screen>
      <Back href={`/admin/gallery/${id}`}>Annulla</Back>
      <Head title="Eliminare la foto?" />
      <img className="hero-img" src={`/media/${photoId}`} alt="Foto da eliminare" />
      <article className="pane"><p className="prose">Se è usata come copertina di un post, sarà rimossa anche da lì.</p>
        <form action={deletePhoto}><input type="hidden" name="id" value={photoId} /><input type="hidden" name="album_id" value={id} /><div className="btn-row"><button className="btn">Elimina definitivamente</button></div></form></article>
    </Screen>
  );

}
