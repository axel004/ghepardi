import Link from 'next/link';
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
  return <main className="panel"><h1>Eliminare l’album?</h1><p>Puoi eliminare “{album.data.title}” solo se è vuoto.</p><form action={deleteAlbum}><input type="hidden" name="id" value={id} /><button>Elimina album</button></form><p><Link href={`/admin/gallery/${id}`}>Annulla</Link></p></main>;
}
