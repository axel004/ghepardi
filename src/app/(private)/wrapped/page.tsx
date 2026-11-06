/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
import { requireReadyMember } from '@/lib/auth';
import { Back, Empty, Notice, Row, Screen, Slide } from '@/components/ui';

export const metadata = { title: 'Wrapped' };

export default async function Wrapped({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { supabase } = await requireReadyMember(), requested = (await searchParams).year, current = new Date().getUTCFullYear();
  const year = requested && /^\d{4}$/.test(requested) && Number(requested) >= 2000 && Number(requested) <= current ? Number(requested) : current;
  const start = `${year}-01-01`, end = `${year + 1}-01-01`;
  const specs = [
    { table: 'posts', column: 'published_at', label: 'Post', line: 'Tutti letti. Almeno il titolo.' },
    { table: 'comments', column: 'created_at', label: 'Commenti', line: 'Nessuno ha cambiato idea.' },
    { table: 'post_reactions', column: 'created_at', label: 'Reazioni', line: 'Più facile che rispondere.' },
    { table: 'photos', column: 'created_at', label: 'Foto', line: 'Private. Per fortuna.' },
    { table: 'polls', column: 'created_at', label: 'Sondaggi', line: 'Il voto è segreto. Il rancore no.' },
    { table: 'events', column: 'event_date', label: 'Eventi', line: 'Qualcuno è pure arrivato puntuale.' },
    { table: 'quotes', column: 'created_at', label: 'Citazioni', line: 'Dette sul serio, purtroppo.' },
    { table: 'awards', column: 'award_year', label: 'Premi', line: 'Più o meno meritati.' },
    { table: 'posts', column: 'published_at', label: 'Post meme', meme: true, line: 'L’archivio storico del club.' },
  ];
  const countQueries = specs.map(spec => {
    let q = supabase.from(spec.table).select('*', { count: 'exact', head: true });
    if (spec.table === 'posts') q = q.eq('status', 'published');
    if (spec.meme) q = q.eq('category', 'meme');
    return spec.table === 'awards' ? q.eq(spec.column, year) : q.gte(spec.column, start).lt(spec.column, end);
  });
  const [counts, votes, winners, awards, photos] = await Promise.all([
    Promise.all(countQueries),
    supabase.rpc('wrapped_vote_counts', { wrapped_year: year }).maybeSingle(),
    supabase.rpc('wrapped_poll_winners', { wrapped_year: year }).limit(21),
    supabase.from('awards').select('id,title,profiles(display_name,username)').eq('award_year', year).order('title').limit(21),
    supabase.from('photos').select('id,album_id').gte('created_at', start).lt('created_at', end).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(3),
  ]);
  const voteData = votes.data as { poll_votes: number; quote_votes: number; undated_votes: number } | null;
  const years = [current, current - 1, current - 2];
  return (
    <Screen>
      <Back href="/altro">Altro</Back>
      <nav className="years" aria-label="Scegli l’anno">
        {years.map(y => <Link key={y} href={`/wrapped?year=${y}`} className="chip" aria-current={y === year ? 'page' : undefined}>{y}</Link>)}
      </nav>
      <section className="fact open">
        <h1 className="sr">Wrapped {year}</h1>
        <span className="moment tnum" aria-hidden="true">{year}</span>
        <b>Il vostro anno insieme</b>
        <p>Tutto quello che c’è, senza inventare niente. Scorri.</p>
      </section>
      {specs.map((spec, i) => (
        <section key={spec.label} className={`fact ${i % 2 === 0 ? 'ink' : ''}`}>
          <span className="moment tnum">{counts[i].error ? '—' : counts[i].count ?? 0}</span>
          <b>{spec.label}</b>
          <p>{spec.line}</p>
        </section>
      ))}
      <section className="fact ink">
        <span className="moment tnum">{votes.error || !voteData ? '—' : Number(voteData.poll_votes) + Number(voteData.quote_votes)}</span>
        <b>Voti con data</b>
        <p>Chi ha votato cosa non lo sa nessuno. Neanche qui.</p>
      </section>
      {(counts.some(c => c.error) || votes.error) && <Notice kind="err">Alcuni conteggi non sono disponibili. Riprova più tardi.</Notice>}
      <Slide title="I premi del branco" shape="c" tone="light">
        {awards.error ? <p className="foot">Impossibile caricare i premi.</p> : !awards.data?.length ? <p className="foot">Nessun premio assegnato per questo anno.</p>
          : awards.data.slice(0, 20).map(award => { const member = Array.isArray(award.profiles) ? award.profiles[0] : award.profiles; return <Row key={award.id} when="Premio" title={award.title} sub={member?.display_name || member?.username || 'Membro non disponibile'} />; })}
        {awards.data && awards.data.length > 20 && <p className="foot"><Link href="/awards">Vedi tutti i premi →</Link></p>}
      </Slide>
      <Slide title="I sondaggi chiusi" shape="a">
        {winners.error ? <p className="foot">Impossibile caricare i risultati.</p> : !winners.data?.length ? <p className="foot">Nessun sondaggio chiuso con voti per questo anno.</p>
          : winners.data.slice(0, 20).map((w: { poll_id: string; question: string; label: string; votes: number }) => <Row key={`${w.poll_id}-${w.label}`} when="Vince" title={w.label} sub={`${w.question} · ${w.votes} voti`} />)}
      </Slide>
      <div className="sec-h"><h2>Qualche ricordo</h2></div>
      {photos.error ? <Empty title="Non si carica">Impossibile caricare le foto.</Empty> : !photos.data?.length ? <Empty title="Nessuna foto">Nessuna foto caricata in questo anno.</Empty>
        : <div className="strip">{photos.data.map(photo => <Link href={`/gallery/${photo.album_id}`} key={photo.id}><img src={`/media/${photo.id}?size=thumb`} alt="Foto della gallery" loading="lazy" /></Link>)}</div>}
      <p className="note">I voti precedenti all’introduzione della data non sono attribuibili a un anno e non sono inclusi{voteData && Number(voteData.undated_votes) > 0 ? ` (${voteData.undated_votes} senza data)` : ''}. I contenuti eliminati non sono conteggiati.</p>
    </Screen>
  );
}
