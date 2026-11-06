import { requireReadyMember } from '@/lib/auth';
import { Empty, Head, Row, Screen, Slide } from '@/components/ui';

export const metadata = { title: 'Il branco' };

export default async function Members() {
  const { supabase } = await requireReadyMember();
  const { data, error } = await supabase.from('profiles').select('username,display_name,bio,role').eq('status', 'active').not('username', 'is', null).not('display_name', 'is', null).order('display_name');
  return (
    <Screen>
      <Head title="Il branco" tick={data ? `${data.length} membri` : undefined}>Le facce dietro alle storie.</Head>
      {error ? <Empty title="Non si carica">Impossibile caricare i membri. Riprova più tardi.</Empty>
        : !data?.length ? <Empty title="Il branco si sta formando" />
        : <Slide shape="a">{data.map(member => (
          <Row key={member.username} href={`/members/${member.username}`} when={member.role === 'admin' ? 'Admin' : 'Membro'} title={member.display_name} sub={member.bio ? `@${member.username} · ${member.bio}` : `@${member.username}`} clamp />
        ))}</Slide>}
    </Screen>
  );
}
