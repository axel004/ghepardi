import { requireReadyMember } from '@/lib/auth';
import { createQuote, deleteQuote, voteQuote } from './actions';
import { Back, Empty, Head, Notice, Screen, Slide } from '@/components/ui';

export const metadata = { title: 'Citazioni' };

export default async function Quotes({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { supabase, profile } = await requireReadyMember(), query = await searchParams;
  const { data, error } = await supabase.from('quotes').select('id,content,speaker,submitted_by,quote_votes(user_id)').order('created_at', { ascending: false }).limit(100);
  return (
    <Screen>
      <Back href="/altro">Altro</Back>
      <Head title="Citazioni">Le frasi del branco che non dovevano finire nel dimenticatoio.</Head>
      {query.error && <Notice kind="err">Controlla i dati e riprova.</Notice>}
      {query.saved && <Notice>Salvato.</Notice>}
      <Slide shape="b" tone="light">
        <details>
          <summary>Aggiungi una citazione</summary>
          <form action={createQuote} className="form">
            <label htmlFor="content">La frase</label><textarea id="content" name="content" maxLength={1000} rows={3} required />
            <label htmlFor="speaker">Chi l’ha detta?</label><input id="speaker" name="speaker" maxLength={80} required />
            <div className="btn-row"><button className="btn">Salva citazione</button></div>
          </form>
        </details>
      </Slide>
      {error ? <Empty title="Non si carica">Impossibile caricare le citazioni.</Empty>
        : !data?.length ? <Empty title="Ancora nessuna perla">Ma sappiamo che esistono.</Empty>
        : data.map(quote => {
          const voted = quote.quote_votes.some(v => v.user_id === profile.id);
          return (
            <article className="pane" key={quote.id}>
              <blockquote className="prose">“{quote.content}”</blockquote>
              <p><b>— {quote.speaker}</b></p>
              <div className="btn-row">
                <form action={voteQuote}>
                  <input type="hidden" name="id" value={quote.id} /><input type="hidden" name="operation" value={voted ? 'remove' : 'add'} />
                  <button className="chip" aria-pressed={voted}>{voted ? 'Votata' : 'Vota'} · {quote.quote_votes.length}</button>
                </form>
                {(quote.submitted_by === profile.id || profile.role === 'admin') && (
                  <details><summary>Elimina</summary>
                    <form action={deleteQuote}><input type="hidden" name="id" value={quote.id} /><button className="btn ghost">Conferma eliminazione</button></form>
                  </details>
                )}
              </div>
            </article>
          );
        })}
    </Screen>
  );
}
