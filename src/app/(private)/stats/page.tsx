import Link from 'next/link';
import { requireReadyMember } from '@/lib/auth';

export default async function Stats({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { supabase } = await requireReadyMember(), { year } = await searchParams;
  const currentYear = new Date().getUTCFullYear();
  const selectedYear = year && /^\d{4}$/.test(year) && Number(year) >= 2000 && Number(year) <= currentYear ? Number(year) : null;
  const start = selectedYear ? `${selectedYear}-01-01` : null, end = selectedYear ? `${selectedYear + 1}-01-01` : null;
  const specs = [
    { table: 'posts', column: 'published_at', label: 'Post pubblicati', icon: '📰' },
    { table: 'comments', column: 'created_at', label: 'Commenti', icon: '💬' },
    { table: 'post_reactions', column: 'created_at', label: 'Reazioni ai post', icon: '🔥' },
    { table: 'photos', column: 'created_at', label: 'Foto caricate', icon: '📸' },
    { table: 'polls', column: 'created_at', label: 'Sondaggi creati', icon: '🗳️' },
    { table: 'quotes', column: 'created_at', label: 'Citazioni', icon: '🗯️' },
    { table: 'events', column: 'event_date', label: 'Eventi in calendario', icon: '📅' },
    { table: 'awards', column: 'award_year', label: 'Premi assegnati', icon: '🏅' },
  ];
  const counts = await Promise.all(specs.map(({ table, column }) => {
    let query = supabase.from(table).select('*', { count: 'exact', head: true });
    if (table === 'posts') query = query.eq('status', 'published');
    if (start && end) query = table === 'awards' ? query.eq(column, selectedYear) : query.gte(column, start).lt(column, end);
    return query;
  }));
  return <main className="panel section-panel"><p className="eyebrow">📊 I NUMERI DEL BRANCO</p><h1>{selectedYear ? `Il ${selectedYear} in numeri` : 'Statistiche'}</h1><p>{selectedYear ? 'Un piccolo riepilogo del vostro anno insieme.' : 'Da quando il club è online, senza inventarsi niente.'}</p><nav className="stats-links" aria-label="Periodo delle statistiche"><Link href="/stats">Sempre</Link><Link href={`/stats?year=${currentYear}`}>{currentYear}</Link><Link href={`/stats?year=${currentYear - 1}`}>{currentYear - 1}</Link></nav><div className="stats-grid">{specs.map((item, index) => <article className="club-card" key={item.table}><span>{item.icon}</span><strong>{counts[index].error ? '—' : counts[index].count ?? 0}</strong><small>{item.label}</small></article>)}</div>{counts.some(result => result.error) && <p className="error">Alcuni numeri non sono disponibili. Riprova più tardi.</p>}{selectedYear && <p><small>I contenuti sono conteggiati per data di pubblicazione o creazione (UTC); gli eventi per la data in calendario e i premi per l’anno assegnato. I contenuti eliminati non sono inclusi.</small></p>}</main>;
}
