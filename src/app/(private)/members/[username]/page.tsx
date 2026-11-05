import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireReadyMember } from '@/lib/auth';
import { Back, Empty, Head, Row, Screen, Slide } from '@/components/ui';

export default async function Member({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { supabase, profile } = await requireReadyMember();
  const { data: member, error } = await supabase.from('profiles').select('id,username,display_name,bio,role').eq('username', username).eq('status', 'active').maybeSingle();
  if (error) return <Screen><Back href="/members">Il branco</Back><Empty title="Non si carica">Impossibile caricare il profilo. Riprova più tardi.</Empty></Screen>;
  if (!member) notFound();
  const awards = await supabase.from('awards').select('id,title,award_year').eq('member_id', member.id).order('award_year', { ascending: false }).order('id', { ascending: false });
  return (
    <Screen>
      <Back href="/members">Il branco</Back>
      <Head title={member.display_name ?? member.username ?? ''} tick={member.role === 'admin' ? 'Admin' : undefined} />
      <article className="pane">
        <p className="meta">@{member.username}</p>
        <p className="prose">{member.bio || 'Ancora nessuna presentazione.'}</p>
        {profile.username === member.username && <div className="btn-row"><Link href="/profile" className="btn ghost">Modifica il tuo profilo</Link></div>}
      </article>
      <Slide title="Premi" shape="b">
        {awards.error ? <p className="foot">Impossibile caricare i premi.</p>
          : !awards.data?.length ? <p className="foot">Ancora nessun premio.</p>
          : awards.data.map(award => <Row key={award.id} when={String(award.award_year)} title={award.title} />)}
        <p className="foot"><Link href="/awards">Tutti i premi →</Link></p>
      </Slide>
    </Screen>
  );
}
