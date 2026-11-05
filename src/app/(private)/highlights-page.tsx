/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
import { requireReadyMember } from '@/lib/auth';
import { isUuid, pageNumber } from '@/lib/posts';
import { deleteHighlight, saveHighlight } from './highlights-actions';
import { Back, Empty, Head, Notice, Pager, Screen, Slide } from '@/components/ui';

type Kind = 'monthly' | 'awards' | 'fame' | 'shame';
type Highlight = { id: string; title: string; description: string | null; photo_id?: string | null; feature_month?: string; subject?: string; award_year?: number; entry_year?: number; member_id?: string | null; profiles?: { username: string | null; display_name: string | null } | null };
type Search = { page?: string; edit?: string; error?: string; saved?: string; deleted?: string };
const settings = {
  monthly: { title: 'Format mensili', intro: 'Le vostre tradizioni, mese dopo mese.', route: '/monthly', table: 'monthly_features', order: 'feature_month' },
  awards: { title: 'Premi', intro: 'I riconoscimenti più meritati. O quasi.', route: '/awards', table: 'awards', order: 'award_year' },
  fame: { title: 'Hall of Fame', intro: 'Le imprese che meritano un posto nella storia.', route: '/hall-of-fame', table: 'hall_entries', order: 'entry_year' },
  shame: { title: 'Hall of Shame', intro: 'Le imprese che nessuno vi lascerà dimenticare.', route: '/hall-of-shame', table: 'hall_entries', order: 'entry_year' },
} as const;

export async function HighlightsPage({ kind, searchParams, girlOnly = false }: { kind: Kind; searchParams: Promise<Search>; girlOnly?: boolean }) {
  const { supabase, profile } = await requireReadyMember(), query = await searchParams, config = settings[kind], page = pageNumber(query.page);
  const base = girlOnly ? '/monthly-girl' : config.route;
  let listing = supabase.from(config.table).select(kind === 'awards' ? '*,profiles(username,display_name)' : '*').order(config.order, { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20);
  if (kind === 'fame' || kind === 'shame') listing = listing.eq('hall', kind);
  if (girlOnly) listing = listing.ilike('title', 'Ragazza del mese');
  const { data, error } = await listing;
  const items = (data ?? []) as unknown as Highlight[];
  const isAdmin = profile.role === 'admin';
  let editing: Highlight | null = null, editError = false;
  if (isAdmin && query.edit && !girlOnly) {
    if (!isUuid(query.edit)) editError = true;
    else {
      let editQuery = supabase.from(config.table).select('*').eq('id', query.edit);
      if (kind === 'fame' || kind === 'shame') editQuery = editQuery.eq('hall', kind);
      const result = await editQuery.maybeSingle();
      editing = result.data as Highlight | null;
      editError = !!result.error || !editing;
    }
  }
  let photos: { id: string }[] = [], members: { id: string; display_name: string | null; username: string | null }[] = [], formError = false;
  if (isAdmin && !girlOnly) {
    if (kind === 'awards') {
      const result = await supabase.from('profiles').select('id,display_name,username').eq('status', 'active').not('display_name', 'is', null).order('display_name');
      members = result.data ?? []; formError = !!result.error;
    } else {
      // shortcut: show the latest 50 photos, add a searchable picker if the gallery grows.
      const result = await supabase.from('photos').select('id').order('created_at', { ascending: false }).order('id', { ascending: false }).limit(50);
      photos = result.data ?? []; formError = !!result.error;
      if (editing?.photo_id && !photos.some(photo => photo.id === editing?.photo_id)) photos.unshift({ id: editing.photo_id });
    }
  }
  const monthName = (iso: string) => new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
  return (
    <Screen>
      <Back href="/altro">Altro</Back>
      <Head title={girlOnly ? 'Ragazza del mese' : config.title}>{config.intro}</Head>
      {kind === 'monthly' && <p className="pager"><Link href={girlOnly ? '/monthly' : '/monthly-girl'} className="btn ghost">{girlOnly ? 'Tutti i format' : 'Ragazza del mese'}</Link>{girlOnly && isAdmin && <Link href="/monthly" className="btn ghost">Aggiungi una rubrica</Link>}</p>}
      {query.error && <Notice kind="err">Controlla i dati e riprova.</Notice>}
      {(query.saved || query.deleted) && <Notice>{query.deleted ? 'Eliminato.' : 'Salvato.'}</Notice>}
      {editError && <Notice kind="err">Elemento non trovato o non disponibile.</Notice>}
      {isAdmin && !girlOnly && (formError ? <Notice kind="err">Impossibile caricare i dati per il modulo. Riprova.</Notice> : (
        <Slide shape="b" tone="light">
          <details open={!!editing}>
            <summary>{editing ? 'Modifica' : 'Aggiungi'}</summary>
            <form action={saveHighlight} className="form"><input type="hidden" name="kind" value={kind} />{editing && <input type="hidden" name="id" value={editing.id} />}
              <label htmlFor="title">{kind === 'monthly' ? 'Nome del format' : 'Titolo'}</label>
              <input id="title" name="title" maxLength={120} required defaultValue={editing?.title} placeholder={kind === 'monthly' ? 'Es. Meme del mese' : undefined} list={kind === 'monthly' ? 'format-suggestions' : undefined} />
              {kind === 'monthly' && <><datalist id="format-suggestions"><option value="Ragazza del mese" /><option value="Foto del mese" /><option value="Meme del mese" /><option value="Ghepardo del mese" /><option value="Quote del mese" /></datalist><small>Per apparire nella pagina dedicata, usa il nome «Ragazza del mese».</small></>}
              {kind === 'monthly' ? <><label htmlFor="month">Mese</label><input id="month" name="month" type="month" min="1900-01" max="2100-12" required defaultValue={editing?.feature_month?.slice(0, 7) ?? new Date().toISOString().slice(0, 7)} /><label htmlFor="subject">Nome o titolo scelto</label><input id="subject" name="subject" maxLength={120} required defaultValue={editing?.subject} placeholder="Es. Il meme della vacanza" /></>
                : <><label htmlFor="year">Anno</label><input id="year" name="year" type="number" inputMode="numeric" min="1900" max="2100" required defaultValue={editing?.award_year ?? editing?.entry_year ?? new Date().getFullYear()} /></>}
              {kind === 'awards' && <><label htmlFor="member_id">Membro premiato</label><select id="member_id" name="member_id" required defaultValue={editing?.member_id ?? ''}><option value="">Scegli un membro</option>{editing?.member_id && !members.some(member => member.id === editing?.member_id) && <option value={editing.member_id}>Membro non disponibile</option>}{members.map(member => <option key={member.id} value={member.id}>{member.display_name}{member.username ? ` (@${member.username})` : ''}</option>)}</select></>}
              <label htmlFor="description">Descrizione <small>(facoltativa)</small></label><textarea id="description" name="description" rows={3} maxLength={2000} defaultValue={editing?.description ?? ''} />
              {kind !== 'awards' && <fieldset><legend>Foto <small>(facoltativa, tra le 50 più recenti)</small></legend>
                <label className="opt" style={{ borderColor: 'var(--pane-line)' }}><input type="radio" name="photo_id" value="" defaultChecked={!editing?.photo_id} /><span>Nessuna foto</span></label>
                <div className="photos" style={{ padding: 0, marginTop: 8 }}>{photos.map((photo, index) => <label key={photo.id} style={{ display: 'block', marginBottom: 8 }}><img src={`/media/${photo.id}?size=thumb`} alt={`Foto ${index + 1}`} loading="lazy" style={{ width: '100%' }} /><span className="opt" style={{ borderColor: 'var(--pane-line)' }}><input type="radio" name="photo_id" value={photo.id} defaultChecked={editing?.photo_id === photo.id} /><span>Usa questa</span></span></label>)}</div>
              </fieldset>}
              <div className="btn-row"><button className="btn">{editing ? 'Salva modifiche' : 'Pubblica'}</button>{editing && <Link href={config.route} className="btn ghost">Annulla modifica</Link>}</div>
            </form>
          </details>
        </Slide>
      ))}
      {error ? <Empty title="Non si carica">Impossibile caricare questa sezione. Riprova.</Empty>
        : !items.length ? <Empty title="Ancora niente da raccontare">Il branco ha tempo per rimediare.</Empty>
        : items.slice(0, 20).map(item => (
          <article className="pane" key={item.id}>
            <p className="meta">{kind === 'monthly' && item.feature_month ? monthName(item.feature_month) : item.award_year ?? item.entry_year}</p>
            {item.photo_id && <img className="hero-img" style={{ margin: '8px 0', width: '100%' }} src={`/media/${item.photo_id}?size=thumb`} alt="" loading="lazy" />}
            <h2 style={{ borderBottom: 0, marginBottom: 0, paddingBottom: 0 }}>{item.title}</h2>
            {item.subject && <h3>{item.subject}</h3>}
            {kind === 'awards' && <p><b>{item.profiles?.username ? <Link href={`/members/${item.profiles.username}`}>{item.profiles.display_name}</Link> : item.profiles?.display_name || 'Membro non disponibile'}</b></p>}
            {item.description && <p className="prose">{item.description}</p>}
            {isAdmin && (
              <div className="btn-row">
                <Link className="btn ghost" href={`${config.route}?edit=${item.id}`}>Modifica</Link>
                <details><summary>Elimina</summary><p className="foot">Confermi l’eliminazione?</p>
                  <form action={deleteHighlight}><input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={item.id} /><button className="btn ghost">Conferma eliminazione</button></form>
                </details>
              </div>
            )}
          </article>
        ))}
      <Pager prev={page > 1 ? `${base}?page=${page - 1}` : undefined} next={items.length > 20 ? `${base}?page=${page + 1}` : undefined} />
    </Screen>
  );
}
