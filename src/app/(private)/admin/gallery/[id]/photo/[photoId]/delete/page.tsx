/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
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
  return <main className="panel"><h1>Eliminare la foto?</h1><p>Se è usata come copertina di un post, sarà rimossa anche da lì.</p><img className="post-image" src={`/media/${photoId}`} alt="Foto da eliminare" /><form action={deletePhoto}><input type="hidden" name="id" value={photoId} /><input type="hidden" name="album_id" value={id} /><button>Elimina definitivamente</button></form><p><Link href={`/admin/gallery/${id}`}>Annulla</Link></p></main>;
}
