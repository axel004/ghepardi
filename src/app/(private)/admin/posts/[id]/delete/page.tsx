import { Back, Head, Screen } from '@/components/ui';
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
  return (
    <Screen>
      <Back href={`/admin/posts/${id}`}>Annulla</Back>
      <Head title="Eliminare il post?" />
      <article className="pane"><p className="prose">“{post.title}” e tutti i suoi commenti e reazioni verranno eliminati. Non si torna indietro.</p>
        <form action={deletePost}><input type="hidden" name="id" value={id} /><div className="btn-row"><button className="btn">Elimina definitivamente</button></div></form></article>
    </Screen>
  );

}
