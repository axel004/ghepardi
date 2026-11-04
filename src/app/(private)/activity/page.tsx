import Link from 'next/link';
import { requireReadyMember } from '@/lib/auth';
import { pageNumber } from '@/lib/posts';

const descriptions: Record<string, string> = { post: 'ha pubblicato un post', comment: 'ha commentato', photo: 'ha aggiunto una foto', poll: 'Nuovo sondaggio', quote: 'ha aggiunto una citazione', event: 'Nuovo evento', award: 'Nuovo premio', monthly: 'Nuovo format mensile', hall: 'Nuovo momento da ricordare' };
export default async function Activity({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { supabase } = await requireReadyMember(), page = pageNumber((await searchParams).page);
  const result = await supabase.from('activity_feed').select('id,happened_at,kind,title,path,actor_id').order('happened_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20);
  const ids = [...new Set((result.data ?? []).flatMap(item => item.actor_id ? [item.actor_id] : []))];
  const people = ids.length ? await supabase.from('profiles').select('id,display_name,username').in('id', ids) : { data: [], error: null };
  return <main className="panel section-panel"><p className="eyebrow">🐆 COSA SUCCEDE NEL BRANCO</p><h1>Attività</h1><p>Le novità del gruppo, in ordine di arrivo.</p>{result.error || people.error ? <p className="error">Impossibile caricare le attività.</p> : !result.data?.length ? <p>Ancora nessuna attività. Il branco si sta scaldando.</p> : <>{result.data.slice(0, 20).map(item => { const actor = people.data?.find(person => person.id === item.actor_id); return <article className="club-card" key={item.id}><p>{item.actor_id && <strong>{actor?.display_name || actor?.username || 'Un membro'} </strong>}{descriptions[item.kind] || 'Novità'}</p><Link href={item.path}>{item.title} →</Link><p><small>{new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Rome' }).format(new Date(item.happened_at))}</small></p></article>; })}<nav className="pagination" aria-label="Pagine attività">{page > 1 && <Link href={`/activity?page=${page - 1}`}>← Più recenti</Link>}{result.data.length > 20 && <Link href={`/activity?page=${page + 1}`}>Più vecchie →</Link>}</nav></>}</main>;
}
