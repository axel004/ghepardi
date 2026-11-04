/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
import { requireReadyMember } from '@/lib/auth';
import { isUuid, pageNumber } from '@/lib/posts';
import { deleteHighlight, saveHighlight } from './highlights-actions';

type Kind = 'monthly' | 'awards' | 'fame' | 'shame';
type Highlight = { id: string; title: string; description: string | null; photo_id?: string | null; feature_month?: string; subject?: string; award_year?: number; entry_year?: number; member_id?: string | null; profiles?: { username: string | null; display_name: string | null } | null };
type Search = { page?: string; edit?: string; error?: string; saved?: string; deleted?: string };
const settings = {
  monthly: { title: 'Format mensili', eyebrow: '🌙 LE RUBRICHE DEL BRANCO', intro: 'Le vostre tradizioni, mese dopo mese.', route: '/monthly', table: 'monthly_features', order: 'feature_month' },
  awards: { title: 'Premi', eyebrow: '🏅 GLORIA AL BRANCO', intro: 'I riconoscimenti più meritati. O quasi.', route: '/awards', table: 'awards', order: 'award_year' },
  fame: { title: 'Hall of Fame', eyebrow: '🏆 MOMENTI LEGGENDARI', intro: 'Le imprese che meritano un posto nella storia.', route: '/hall-of-fame', table: 'hall_entries', order: 'entry_year' },
  shame: { title: 'Hall of Shame', eyebrow: '🤡 MOMENTI INDIMENTICABILI', intro: 'Le imprese che nessuno vi lascerà dimenticare.', route: '/hall-of-shame', table: 'hall_entries', order: 'entry_year' },
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
  return <main className="panel section-panel"><p className="eyebrow">{config.eyebrow}</p><h1>{girlOnly ? 'Ragazza del mese' : config.title}</h1><p>{config.intro}</p>
    {kind === 'monthly' && <p><Link href={girlOnly ? '/monthly' : '/monthly-girl'}>{girlOnly ? '← Tutti i format' : '👑 Ragazza del mese →'}</Link>{girlOnly && isAdmin && <> · <Link href="/monthly">Aggiungi una rubrica</Link></>}</p>}
    {query.error && <p className="error" role="alert">Operazione non riuscita. Controlla i dati e riprova.</p>}{(query.saved || query.deleted) && <p role="status">{query.deleted ? 'Eliminato.' : 'Salvato!'}</p>}{editError && <p className="error">Elemento non trovato o non disponibile.</p>}
    {isAdmin && !girlOnly && (formError ? <p className="error">Impossibile caricare i dati per il modulo. Riprova.</p> : <details className="club-create" open={!!editing}><summary>{editing ? 'Modifica' : '+ Aggiungi'}</summary><form action={saveHighlight} className="form"><input type="hidden" name="kind" value={kind} />{editing && <input type="hidden" name="id" value={editing.id} />}
      <label htmlFor="title">{kind === 'monthly' ? 'Nome del format' : 'Titolo'}</label><input id="title" name="title" maxLength={120} required defaultValue={editing?.title} placeholder={kind === 'monthly' ? 'Es. Meme del mese' : undefined} list={kind === 'monthly' ? 'format-suggestions' : undefined} />{kind === 'monthly' && <><datalist id="format-suggestions"><option value="Ragazza del mese" /><option value="Foto del mese" /><option value="Meme del mese" /><option value="Ghepardo del mese" /><option value="Quote del mese" /></datalist><small>Per apparire nella pagina dedicata, usa il nome «Ragazza del mese».</small></>}
      {kind === 'monthly' ? <><label htmlFor="month">Mese</label><input id="month" name="month" type="month" min="1900-01" max="2100-12" required defaultValue={editing?.feature_month?.slice(0, 7) ?? new Date().toISOString().slice(0, 7)} /><label htmlFor="subject">Nome o titolo scelto</label><input id="subject" name="subject" maxLength={120} required defaultValue={editing?.subject} placeholder="Es. Il meme della vacanza" /></> : <><label htmlFor="year">Anno</label><input id="year" name="year" type="number" min="1900" max="2100" required defaultValue={editing?.award_year ?? editing?.entry_year ?? new Date().getFullYear()} /></>}
      {kind === 'awards' && <><label htmlFor="member_id">Membro premiato</label><select id="member_id" name="member_id" required defaultValue={editing?.member_id ?? ''}><option value="">Scegli un membro</option>{editing?.member_id && !members.some(member => member.id === editing?.member_id) && <option value={editing.member_id}>Membro non disponibile</option>}{members.map(member => <option key={member.id} value={member.id}>{member.display_name}{member.username ? ` (@${member.username})` : ''}</option>)}</select></>}
      <label htmlFor="description">Descrizione <small>(facoltativa)</small></label><textarea id="description" name="description" rows={3} maxLength={2000} defaultValue={editing?.description ?? ''} />
      {kind !== 'awards' && <fieldset><legend>Foto <small>(facoltativa)</small></legend><p><small>Scegli tra le 50 foto più recenti della <Link href="/admin/gallery">gallery</Link>.</small></p><label><input type="radio" name="photo_id" value="" defaultChecked={!editing?.photo_id} /> Nessuna foto</label><div className="photo-grid">{photos.map((photo, index) => <label className="cover-choice" key={photo.id}><img src={`/media/${photo.id}?size=thumb`} alt={`Foto ${index + 1}`} loading="lazy" /><input type="radio" name="photo_id" value={photo.id} defaultChecked={editing?.photo_id === photo.id} /> Usa questa</label>)}</div></fieldset>}
      <button>{editing ? 'Salva modifiche' : 'Pubblica'}</button>{editing && <Link href={config.route}>Annulla modifica</Link>}</form></details>)}
    {error ? <p className="error">Impossibile caricare questa sezione. Riprova.</p> : !items.length ? <p>Ancora niente da raccontare. Il branco ha tempo per rimediare.</p> : items.slice(0, 20).map(item => <article className="club-card highlight-card" key={item.id}>
      {item.photo_id && <img className="highlight-image" src={`/media/${item.photo_id}?size=thumb`} alt="" loading="lazy" />}<div><p className="eyebrow">{kind === 'monthly' && item.feature_month ? new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${item.feature_month}T00:00:00Z`)) : item.award_year ?? item.entry_year}</p><h2>{item.title}</h2>{item.subject && <h3>{item.subject}</h3>}{kind === 'awards' && <p>🏅 {item.profiles?.username ? <Link href={`/members/${item.profiles.username}`}>{item.profiles.display_name}</Link> : item.profiles?.display_name || 'Membro non disponibile'}</p>}{item.description && <p className="post-content">{item.description}</p>}
      {isAdmin && <div className="club-admin"><Link href={`${config.route}?edit=${item.id}`}>Modifica</Link><details><summary>Elimina</summary><p>Confermi l’eliminazione?</p><form action={deleteHighlight}><input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={item.id} /><button className="secondary">Conferma eliminazione</button></form></details></div>}</div></article>)}
    <nav className="pagination" aria-label="Pagine archivio">{page > 1 && <Link href={`${base}?page=${page - 1}`}>← Più recenti</Link>}{items.length > 20 && <Link href={`${base}?page=${page + 1}`}>Più vecchi →</Link>}</nav></main>;
}
