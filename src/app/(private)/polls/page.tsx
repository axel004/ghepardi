import { requireReadyMember } from '@/lib/auth';
import { closePoll, createPoll, deleteClubItem, vote } from '../club-actions';

export default async function Polls({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; voted?: string }> }) {
  const { supabase, profile } = await requireReadyMember(), query = await searchParams;
  const [polls, results, mine] = await Promise.all([
    supabase.from('polls').select('id,question,closes_on,closed,poll_options(id,label,position)').order('created_at', { ascending: false }).limit(100),
    supabase.rpc('poll_results'),
    supabase.from('poll_votes').select('poll_id,option_id').eq('user_id', profile.id),
  ]);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return <main className="panel section-panel"><p className="eyebrow">🗳 LA PAROLA AL BRANCO</p><h1>Sondaggi</h1><p>Una scelta a testa, risultati per tutti. I voti sono riservati.</p>
    {query.error && <p className="error" role="alert">Operazione non riuscita: controlla i dati, oppure il sondaggio potrebbe essere chiuso o già votato.</p>}{(query.saved || query.voted) && <p role="status">{query.voted ? 'Voto registrato!' : 'Fatto!'}</p>}
    {profile.role === 'admin' && <details className="club-create"><summary>+ Crea un sondaggio</summary><form action={createPoll} className="form"><label htmlFor="question">Domanda</label><input id="question" name="question" maxLength={200} required /><label htmlFor="options">Opzioni (da 2 a 6, una per riga)</label><textarea id="options" name="options" rows={4} required /><label htmlFor="closes_on">Aperto fino al giorno <small>(facoltativo, ora italiana)</small></label><input id="closes_on" name="closes_on" type="date" /><button>Crea sondaggio</button></form></details>}
    {polls.error || results.error || mine.error ? <p className="error">Impossibile caricare i sondaggi. Riprova.</p> : !polls.data?.length ? <p>Ancora nessun sondaggio. Si accettano domande scomode.</p> : polls.data.map(poll => {
      const selected = mine.data?.find(v => v.poll_id === poll.id), closed = poll.closed || !!(poll.closes_on && poll.closes_on < today);
      const options = [...poll.poll_options].sort((a, b) => a.position - b.position);
      return <article className="club-card" key={poll.id}><h2>{poll.question}</h2><p><small>{closed ? 'Chiuso' : poll.closes_on ? `Aperto fino al ${poll.closes_on.split('-').reverse().join('/')}` : 'Votazione aperta'}{selected ? ' · Hai votato' : ''}</small></p>
        {selected || closed ? <ul className="results-list">{options.map(option => <li key={option.id}><span>{option.label}{selected?.option_id === option.id ? ' ✓' : ''}</span><strong>{results.data?.find((r: { option_id: string }) => r.option_id === option.id)?.votes ?? 0} voti</strong></li>)}</ul> : <form action={vote} className="vote-form"><input type="hidden" name="poll" value={poll.id} /><fieldset><legend>La tua scelta</legend>{options.map(option => <label key={option.id}><input type="radio" name="option" value={option.id} required /> {option.label}</label>)}</fieldset><button>Vota</button></form>}
        {profile.role === 'admin' && <div className="club-admin">{!closed && <form action={closePoll}><input type="hidden" name="id" value={poll.id} /><button className="secondary">Chiudi votazione</button></form>}<details><summary>Elimina sondaggio</summary><p>Verranno eliminati anche i voti.</p><form action={deleteClubItem}><input type="hidden" name="kind" value="polls" /><input type="hidden" name="id" value={poll.id} /><button className="secondary">Conferma eliminazione</button></form></details></div>}</article>;
    })}</main>;
}
