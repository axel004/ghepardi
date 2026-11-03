import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { isUuid } from '@/lib/posts';
import { deletePost } from '../../../../posts/actions';
export default async function ConfirmDelete({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin(), { id } = await params;
  if (!isUuid(id)) notFound();
  const { data: post, error } = await supabase.from('posts').select('id,title').eq('id', id).maybeSingle();
  if (error) throw new Error('Impossibile caricare il post');
  if (!post) notFound();
  return <main className="panel"><h1>Eliminare il post?</h1><p>“{post.title}” e tutti i suoi commenti e reaction verranno eliminati.</p><form action={deletePost}><input type="hidden" name="id" value={id} /><button>Elimina definitivamente</button></form><p><Link href={`/admin/posts/${id}`}>Annulla</Link></p></main>;
}
