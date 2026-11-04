/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
import { requireReadyMember } from '@/lib/auth';

export default async function Wrapped({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { supabase } = await requireReadyMember(), requested = (await searchParams).year, current = new Date().getUTCFullYear();
  const year = requested && /^\d{4}$/.test(requested) && Number(requested) >= 2000 && Number(requested) <= current ? Number(requested) : current;
  const start = `${year}-01-01`, end = `${year + 1}-01-01`;
  const specs = [
    { table: 'posts', column: 'published_at', label: 'Post', icon: '📰' },
    { table: 'comments', column: 'created_at', label: 'Commenti', icon: '💬' },
    { table: 'post_reactions', column: 'created_at', label: 'Reazioni', icon: '🔥' },
    { table: 'photos', column: 'created_at', label: 'Foto', icon: '📸' },
    { table: 'polls', column: 'created_at', label: 'Sondaggi', icon: '🗳️' },
    { table: 'events', column: 'event_date', label: 'Eventi', icon: '📅' },
    { table: 'quotes', column: 'created_at', label: 'Citazioni', icon: '🗯️' },
    { table: 'awards', column: 'award_year', label: 'Premi', icon: '🏅' },
    { table: 'posts', column: 'published_at', label: 'Post meme', icon: '🤡', meme: true },
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
  return <main className="panel section-panel wrapped"><p className="eyebrow">🐆 IL VOSTRO ANNO INSIEME</p><h1>GHEPARDI<br /><span>WRAPPED {year}</span></h1><p>Storie, perle e momenti del branco. Tutto quello che c’è, senza inventare niente.</p>
    <form method="get" className="wrapped-year"><label htmlFor="year">Scegli l’anno</label><input id="year" type="number" name="year" min="2000" max={current} defaultValue={year} required /><button>Vai</button></form>
    <h2>L’anno in numeri</h2><div className="stats-grid">{specs.map((spec, index) => <article className="club-card" key={`${spec.table}-${spec.label}`}><span>{spec.icon}</span><strong>{counts[index].error ? '—' : counts[index].count ?? 0}</strong><small>{spec.label}</small></article>)}<article className="club-card"><span>☑️</span><strong>{votes.error || !voteData ? '—' : Number(voteData.poll_votes) + Number(voteData.quote_votes)}</strong><small>Voti registrati con data</small></article></div>
    {(counts.some(c => c.error) || votes.error) && <p className="error">Alcuni conteggi non sono disponibili. Riprova più tardi.</p>}
    <p><small>I voti precedenti all’introduzione della data non sono attribuibili a un anno e non sono inclusi{voteData && Number(voteData.undated_votes) > 0 ? ` (${voteData.undated_votes} senza data)` : ''}. I contenuti eliminati non sono conteggiati. Date dei contenuti in UTC; eventi e premi seguono la data o l’anno indicato.</small></p>
    <section><h2>🏆 I premi del branco</h2>{awards.error ? <p className="error">Impossibile caricare i premi.</p> : !awards.data?.length ? <p>Nessun premio assegnato per questo anno.</p> : <>{awards.data.slice(0, 20).map(award => { const member = Array.isArray(award.profiles) ? award.profiles[0] : award.profiles; return <article className="club-card" key={award.id}><strong>{award.title}</strong><p>{member?.display_name || member?.username || 'Membro non disponibile'}</p></article>; })}{awards.data.length > 20 && <Link href="/awards">Vedi tutti i premi →</Link>}</>}</section>
    <section><h2>🗳️ I sondaggi chiusi</h2><p><small>Risultati attuali dei sondaggi creati nel {year}; sono mostrati anche gli eventuali pari merito.</small></p>{winners.error ? <p className="error">Impossibile caricare i risultati.</p> : !winners.data?.length ? <p>Nessun sondaggio chiuso con voti per questo anno.</p> : <>{winners.data.slice(0, 20).map((winner: { poll_id: string; question: string; label: string; votes: number }) => <article className="club-card" key={`${winner.poll_id}-${winner.label}`}><strong>{winner.question}</strong><p>🏆 {winner.label} · {winner.votes} voti</p></article>)}{winners.data.length > 20 && <Link href="/polls">Vedi i sondaggi →</Link>}</>}</section>
    <section><h2>📸 Qualche ricordo</h2>{photos.error ? <p className="error">Impossibile caricare le foto.</p> : !photos.data?.length ? <p>Nessuna foto caricata in questo anno.</p> : <div className="photo-grid">{photos.data.map(photo => <Link href={`/gallery/${photo.album_id}`} key={photo.id}><img src={`/media/${photo.id}?size=thumb`} alt="Foto della gallery" loading="lazy" /></Link>)}</div>}</section>
  </main>;
}
