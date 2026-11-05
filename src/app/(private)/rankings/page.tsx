import { requireReadyMember } from '@/lib/auth';
import { createRanking, deleteClubItem, saveScore } from '../club-actions';
import { Back, Empty, Head, Notice, Row, Screen, Slide } from '@/components/ui';

export const metadata = { title: 'Classifiche' };

export default async function Rankings({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { supabase, profile } = await requireReadyMember(), query = await searchParams;
  const { data, error } = await supabase.from('rankings').select('id,title,ranking_entries(id,name,points)').order('created_at', { ascending: false }).limit(100);
  const admin = profile.role === 'admin';
  return (
    <Screen>
      <Back href="/altro">Altro</Back>
      <Head title="Classifiche">Numeri ufficialissimi, discussioni inevitabili.</Head>
      {query.error && <Notice kind="err">Controlla i dati e riprova.</Notice>}
      {query.saved && <Notice>Classifica aggiornata.</Notice>}
      {admin && (
        <Slide shape="b" tone="light"><details><summary>Crea una classifica</summary>
          <form action={createRanking} className="form"><label htmlFor="title">Titolo</label><input id="title" name="title" maxLength={120} required /><div className="btn-row"><button className="btn">Crea classifica</button></div></form>
        </details></Slide>
      )}
      {error ? <Empty title="Non si carica">Impossibile caricare le classifiche.</Empty>
        : !data?.length ? <Empty title="Nessuna classifica">Chi conquista il primo posto?</Empty>
        : data.map((ranking, i) => {
          const entries = [...ranking.ranking_entries].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'it'));
          let place = 0, last: number | null = null;
          return (
            <Slide key={ranking.id} title={ranking.title} shape={i % 2 ? 'c' : 'a'}>
              {!entries.length ? <p className="foot">Ancora nessun punteggio.</p> : entries.map((entry, idx) => {
                if (entry.points !== last) { place = idx + 1; last = entry.points; }
                return (
                  <Row key={entry.id} className={`rank ${place === 1 ? 'top1' : ''}`} when={`${place}°`} title={entry.name} mark={<span className="points tnum">{entry.points}</span>} />
                );
              })}
              {admin && (
                <>
                  <details><summary>Aggiungi o aggiorna punteggio</summary>
                    <form action={saveScore} className="form"><input type="hidden" name="ranking" value={ranking.id} />
                      <p className="foot"><small>Per aggiornare un punteggio usa lo stesso nome.</small></p>
                      <label htmlFor={`name-${ranking.id}`}>Nome</label><input id={`name-${ranking.id}`} name="name" maxLength={80} required />
                      <label htmlFor={`points-${ranking.id}`}>Punti</label><input id={`points-${ranking.id}`} name="points" type="number" inputMode="numeric" min="-1000000" max="1000000" required />
                      <div className="btn-row"><button className="btn">Salva punteggio</button></div>
                    </form>
                  </details>
                  {entries.length > 0 && <details><summary>Rimuovi un punteggio</summary>
                    {entries.map(entry => (
                      <form key={entry.id} action={deleteClubItem} className="row solo">
                        <input type="hidden" name="kind" value="ranking_entries" /><input type="hidden" name="id" value={entry.id} />
                        <span className="what"><b>{entry.name}</b></span><button className="text-btn">Rimuovi</button>
                      </form>
                    ))}
                  </details>}
                  <details><summary>Elimina classifica</summary><p className="foot">Verranno eliminati anche i punteggi.</p>
                    <form action={deleteClubItem}><input type="hidden" name="kind" value="rankings" /><input type="hidden" name="id" value={ranking.id} /><div className="btn-row"><button className="btn ghost">Conferma eliminazione</button></div></form>
                  </details>
                </>
              )}
            </Slide>
          );
        })}
    </Screen>
  );
}
