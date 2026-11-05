import { requireReadyMember } from '@/lib/auth';
import { pageNumber } from '@/lib/posts';
import { Back, Empty, Head, Pager, Row, Screen, Slide, stamp } from '@/components/ui';

export const metadata = { title: 'Attività' };
const descriptions: Record<string, string> = { post: 'ha pubblicato un post', comment: 'ha commentato', photo: 'ha aggiunto una foto', poll: 'Nuovo sondaggio', quote: 'ha aggiunto una citazione', event: 'Nuovo evento', award: 'Nuovo premio', monthly: 'Nuovo format mensile', hall: 'Nuovo momento da ricordare' };

export default async function Activity({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { supabase } = await requireReadyMember(), page = pageNumber((await searchParams).page);
  const result = await supabase.from('activity_feed').select('id,happened_at,kind,title,path,actor_id').order('happened_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20);
  const ids = [...new Set((result.data ?? []).flatMap(item => item.actor_id ? [item.actor_id] : []))];
  const people = ids.length ? await supabase.from('profiles').select('id,display_name,username').in('id', ids) : { data: [], error: null };
  return (
    <Screen>
      <Back href="/altro">Altro</Back>
      <Head title="Attività">Le novità del gruppo, in ordine di arrivo.</Head>
      {result.error || people.error ? <Empty title="Non si carica">Impossibile caricare le attività.</Empty>
        : !result.data?.length ? <Empty title="Ancora niente">Il branco si sta scaldando.</Empty>
        : <Slide shape="a">{result.data.slice(0, 20).map(item => {
          const actor = people.data?.find(person => person.id === item.actor_id);
          const who = item.actor_id ? `${actor?.display_name || actor?.username || 'Un membro'} ` : '';
          return <Row key={item.id} href={item.path} when={stamp(item.happened_at)} title={item.title} sub={`${who}${descriptions[item.kind] || 'Novità'}`} />;
        })}</Slide>}
      <Pager prev={page > 1 ? `/activity?page=${page - 1}` : undefined} next={result.data && result.data.length > 20 ? `/activity?page=${page + 1}` : undefined} />
    </Screen>
  );
}
