import Link from 'next/link';
import { requireReadyMember } from '@/lib/auth';
import { pageNumber } from '@/lib/posts';
import { markNotificationsRead } from './actions';

export default async function Notifications({ searchParams }: { searchParams: Promise<{ page?: string; error?: string }> }) {
  const { supabase, profile } = await requireReadyMember(), query = await searchParams, page = pageNumber(query.page);
  const result = await supabase.from('notifications').select('id,kind,comment_id,created_at,read_at,posts!inner(slug,title),profiles!notifications_actor_id_fkey(display_name,username)').eq('recipient_id', profile.id).order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20);
  return <main className="panel section-panel"><p className="eyebrow">🔔 QUALCUNO TI CERCA</p><h1>Notifiche</h1><p>Menzioni e risposte ai tuoi commenti, tutte qui.</p>{query.error && <p role="alert" className="error">Impossibile aggiornare le notifiche.</p>}
    {result.error ? <p className="error">Impossibile caricare le notifiche.</p> : !result.data?.length ? <p>Ancora nessuna notifica.</p> : <><form action={markNotificationsRead}><button className="secondary">Segna tutte come lette</button></form>{result.data.slice(0, 20).map(item => {
      const actor = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles, post = Array.isArray(item.posts) ? item.posts[0] : item.posts;
      return post && <article className={`club-card${item.read_at ? '' : ' notification-unread'}`} key={item.id}><p><strong>{actor?.display_name || actor?.username || 'Un membro'}</strong> {item.kind === 'reply' ? 'ha risposto al tuo commento' : 'ti ha menzionato'}.</p><Link href={`/posts/${post.slug}${item.comment_id ? `?focus=${item.comment_id}#comment-${item.comment_id}` : ''}`}>{post.title} →</Link><p><small>{new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Rome' }).format(new Date(item.created_at))}{item.read_at ? '' : ' · Nuova'}</small></p></article>;
    })}<nav className="pagination" aria-label="Pagine notifiche">{page > 1 && <Link href={`/notifications?page=${page - 1}`}>← Più recenti</Link>}{result.data.length > 20 && <Link href={`/notifications?page=${page + 1}`}>Più vecchie →</Link>}</nav></>}</main>;
}
