import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { pageNumber } from '@/lib/posts';
import { Back, Empty, Head, Notice, Pager, Row, Screen, Slide } from '@/components/ui';

export default async function AdminPosts({ searchParams }: { searchParams: Promise<{ page?: string; error?: string; saved?: string; deleted?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams, page = pageNumber(params.page);
  const { data: posts, error } = await supabase.from('posts').select('id, title, status').order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20);
  return (
    <Screen>
      <Back href="/admin">Pannello admin</Back>
      <Head title="I post" />
      <p className="pager"><Link href="/admin/posts/new" className="btn" transitionTypes={['nav-forward']}>Scrivi un post</Link></p>
      {params.saved && <Notice>Post salvato.</Notice>}{params.deleted && <Notice>Post eliminato.</Notice>}
      {(error || params.error) && <Notice kind="err">Operazione non riuscita. Riprova.</Notice>}
      {!error && !posts?.length ? <Empty title="Nessun post">Non ci sono ancora post.</Empty>
        : <Slide shape="a">{posts?.slice(0, 20).map(post => <Row key={post.id} href={`/admin/posts/${post.id}`} when={post.status === 'published' ? 'Online' : 'Bozza'} title={post.title} />)}</Slide>}
      <Pager prev={page > 1 ? `/admin/posts?page=${page - 1}` : undefined} next={posts && posts.length > 20 ? `/admin/posts?page=${page + 1}` : undefined} prevLabel="Precedenti" nextLabel="Successivi" />
    </Screen>
  );
}
