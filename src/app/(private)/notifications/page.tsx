import { requireReadyMember } from '@/lib/auth';
import { pageNumber } from '@/lib/posts';
import { markNotificationsRead } from './actions';
import { Empty, Head, Mark, Notice, Pager, Row, Screen, Slide, stamp } from '@/components/ui';

export const metadata = { title: 'Notifiche' };

export default async function Notifications({ searchParams }: { searchParams: Promise<{ page?: string; error?: string }> }) {
  const { supabase, profile } = await requireReadyMember(), query = await searchParams, page = pageNumber(query.page);
  const result = await supabase.from('notifications').select('id,kind,comment_id,created_at,read_at,posts!inner(slug,title),profiles!notifications_actor_id_fkey(display_name,username)').eq('recipient_id', profile.id).order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20);
  const unread = result.data?.filter(item => !item.read_at).length ?? 0;
  return (
    <Screen>
      <Head title="Notifiche" tick={unread ? `${unread} nuove` : undefined}>Menzioni e risposte ai tuoi commenti.</Head>
      {query.error && <Notice kind="err">Impossibile aggiornare le notifiche.</Notice>}
      {result.error ? <Empty title="Non si carica">Impossibile caricare le notifiche.</Empty>
        : !result.data?.length ? <Empty title="Ancora nessuna notifica">Nessuno ti cerca. Per ora.</Empty>
        : <>
          {unread > 0 && <form action={markNotificationsRead} className="btn-row" style={{ padding: '0 var(--gut)', marginBottom: 'var(--gap)' }}><button className="btn ghost">Segna tutte come lette</button></form>}
          <Slide shape="a">{result.data.slice(0, 20).map(item => {
            const actor = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles, post = Array.isArray(item.posts) ? item.posts[0] : item.posts;
            return post && <Row key={item.id} href={`/posts/${post.slug}${item.comment_id ? `?focus=${item.comment_id}#comment-${item.comment_id}` : ''}`}
              when={stamp(item.created_at)} title={post.title} sub={`${actor?.display_name || actor?.username || 'Un membro'} ${item.kind === 'reply' ? 'ha risposto al tuo commento' : 'ti ha menzionato'}`}
              mark={<Mark state={item.read_at ? 'done' : 'open'} />} />;
          })}</Slide>
        </>}
      <Pager prev={page > 1 ? `/notifications?page=${page - 1}` : undefined} next={result.data && result.data.length > 20 ? `/notifications?page=${page + 1}` : undefined} prevLabel="Più recenti" nextLabel="Più vecchie" />
    </Screen>
  );
}
