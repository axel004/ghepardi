import { requireReadyMember } from '@/lib/auth';
import { closePoll, createPoll, deleteClubItem, vote } from '../club-actions';
import { Back, Empty, Head, Mark, Notice, Screen, Slide, dateIt } from '@/components/ui';
import { Submit } from '@/components/submit';

export const metadata = { title: 'Sondaggi' };

export default async function Polls({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; voted?: string }> }) {
  const { supabase, profile } = await requireReadyMember(), query = await searchParams;
  const [polls, results, mine] = await Promise.all([
    supabase.from('polls').select('id,question,closes_on,closed,poll_options(id,label,position)').order('created_at', { ascending: false }).limit(100),
    supabase.rpc('poll_results'),
    supabase.from('poll_votes').select('poll_id,option_id').eq('user_id', profile.id),
  ]);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return (
    <Screen>
      <Back href="/altro">Altro</Back>
      <Head title="Sondaggi">Una scelta a testa, risultati per tutti. Il tuo voto resta segreto.</Head>
      {query.error && <Notice kind="err">{query.error === 'vote' ? 'Voto non registrato: forse il sondaggio è chiuso o avevi già votato. Ricarica e controlla.' : 'Controlla i dati e riprova: servono una domanda e da 2 a 6 opzioni diverse.'}</Notice>}
      {(query.saved || query.voted) && <Notice>{query.voted ? 'Voto depositato. Nessuno vedrà cosa hai scelto.' : 'Salvato.'}</Notice>}
      {profile.role === 'admin' && (
        <Slide shape="b" tone="light">
          <details>
            <summary>Crea un sondaggio</summary>
            <form action={createPoll} className="form">
              <label htmlFor="question">Domanda</label><input id="question" name="question" maxLength={200} required />
              <label htmlFor="options">Opzioni (da 2 a 6, una per riga)</label><textarea id="options" name="options" rows={4} required />
              <label htmlFor="closes_on">Aperto fino al giorno <small>(facoltativo, ora italiana)</small></label><input id="closes_on" name="closes_on" type="date" />
              <div className="btn-row"><Submit>Crea sondaggio</Submit></div>
            </form>
          </details>
        </Slide>
      )}
      {polls.error || results.error || mine.error ? <Empty title="Non si carica">Impossibile caricare i sondaggi. Riprova.</Empty>
        : !polls.data?.length ? <Empty title="Ancora nessun sondaggio">Si accettano domande scomode.</Empty>
        : polls.data.map((poll, index) => {
          const selected = mine.data?.find(v => v.poll_id === poll.id), closed = poll.closed || !!(poll.closes_on && poll.closes_on < today);
          const options = [...poll.poll_options].sort((a, b) => a.position - b.position);
          const votes = (id: string) => Number(results.data?.find((r: { option_id: string }) => r.option_id === id)?.votes ?? 0);
          const total = options.reduce((sum, o) => sum + votes(o.id), 0);
          const soon = !closed && poll.closes_on ? Date.parse(`${poll.closes_on}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`) <= 86400000 : false;
          const status = closed ? 'Chiuso' : poll.closes_on ? `Aperto fino al ${dateIt(poll.closes_on)}` : 'Votazione aperta';
          return (
            <Slide key={poll.id} shape={index % 2 ? 'b' : 'a'} tone={selected || closed ? 'dark' : 'light'} title={poll.question} lean={closed ? 'upright' : soon ? 'steep' : undefined} className={query.voted ? 'just-voted' : ''}>
              <p className="foot" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mark state={closed ? 'void' : selected ? 'done' : 'open'} label={closed ? 'chiuso' : selected ? 'hai votato' : 'non hai ancora votato'} /><span>{status}{selected ? ' · Hai votato' : ''}</span>
              </p>
              {selected || closed ? (
                <div role="list" aria-label="Risultati">
                  {options.map((option, i) => {
                    const n = votes(option.id);
                    return (
                      <div role="listitem" className="row solo res" key={option.id} style={{ ['--v' as string]: total ? n / total : 0, ['--i' as string]: i }}>
                        <span className="what"><b>{option.label}</b>{selected?.option_id === option.id && <small>Il tuo voto, lo vedi solo tu</small>}</span><span className="points tnum">{n} {n === 1 ? 'voto' : 'voti'}</span>
                        <i className="bar-fill" aria-hidden="true" />
                      </div>
                    );
                  })}
                  <p className="foot">{total} {total === 1 ? 'voto in tutto' : 'voti in tutto'}</p>
                </div>
              ) : (
                <form action={vote}>
                  <input type="hidden" name="poll" value={poll.id} />
                  <fieldset><legend className="lbl">La tua scelta</legend>
                    {options.map(option => <label className="opt" key={option.id}><input type="radio" name="option" value={option.id} required /><span>{option.label}</span></label>)}
                  </fieldset>
                  <div className="btn-row"><Submit pending="Deposito…">Deposita il voto</Submit></div>
                  <p className="foot"><small>Una volta depositato non si cambia, e nessuno vede cosa hai scelto.</small></p>
                </form>
              )}
              {profile.role === 'admin' && (
                <details className="manage"><summary>Gestisci</summary>
                  {!closed && <form action={closePoll}><input type="hidden" name="id" value={poll.id} /><div className="btn-row"><Submit className="btn ghost">Chiudi votazione</Submit></div></form>}
                  <h3>Elimina sondaggio</h3><p className="foot">Verranno eliminati anche i voti.</p>
                  <form action={deleteClubItem}><input type="hidden" name="kind" value="polls" /><input type="hidden" name="id" value={poll.id} /><Submit className="btn ghost">Conferma eliminazione</Submit></form>
                </details>
              )}
            </Slide>
          );
        })}
    </Screen>
  );
}
