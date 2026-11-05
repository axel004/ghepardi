import Link from 'next/link';
import { requireReadyMember } from '@/lib/auth';
import { Back, Head, Notice, Screen, Slide } from '@/components/ui';

export const metadata = { title: 'Statistiche' };

export default async function Stats({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { supabase } = await requireReadyMember(), { year } = await searchParams;
  const currentYear = new Date().getUTCFullYear();
  const selectedYear = year && /^\d{4}$/.test(year) && Number(year) >= 2000 && Number(year) <= currentYear ? Number(year) : null;
  const start = selectedYear ? `${selectedYear}-01-01` : null, end = selectedYear ? `${selectedYear + 1}-01-01` : null;
  const specs = [
    { table: 'posts', column: 'published_at', label: 'Post pubblicati' },
    { table: 'comments', column: 'created_at', label: 'Commenti' },
    { table: 'post_reactions', column: 'created_at', label: 'Reazioni ai post' },
    { table: 'photos', column: 'created_at', label: 'Foto caricate' },
    { table: 'polls', column: 'created_at', label: 'Sondaggi creati' },
    { table: 'quotes', column: 'created_at', label: 'Citazioni' },
    { table: 'events', column: 'event_date', label: 'Eventi in calendario' },
    { table: 'awards', column: 'award_year', label: 'Premi assegnati' },
  ];
  const counts = await Promise.all(specs.map(({ table, column }) => {
    let query = supabase.from(table).select('*', { count: 'exact', head: true });
    if (table === 'posts') query = query.eq('status', 'published');
    if (start && end) query = table === 'awards' ? query.eq(column, selectedYear) : query.gte(column, start).lt(column, end);
    return query;
  }));
  const values = counts.map(c => (c.error ? null : c.count ?? 0));
  const max = Math.max(1, ...values.map(v => v ?? 0));
  return (
    <Screen>
      <Back href="/altro">Altro</Back>
      <Head title={selectedYear ? `Il ${selectedYear}` : 'Statistiche'}>{selectedYear ? 'Un piccolo riepilogo del vostro anno insieme.' : 'Da quando il club è online, senza inventarsi niente.'}</Head>
      <nav className="chips" style={{ padding: '0 var(--gut) var(--gap)' }} aria-label="Periodo delle statistiche">
        {[['/stats', 'Sempre', !selectedYear], [`/stats?year=${currentYear}`, String(currentYear), selectedYear === currentYear], [`/stats?year=${currentYear - 1}`, String(currentYear - 1), selectedYear === currentYear - 1]].map(([href, label, on]) => (
          <Link key={href as string} href={href as string} className="chip" aria-current={on ? 'page' : undefined}>{label as string}</Link>
        ))}
      </nav>
      <Slide shape="a">
        {specs.map((item, i) => (
          <div className="stat" key={item.table} style={{ position: 'relative' }}>
            <span>{item.label}</span><b className="tnum">{values[i] ?? '—'}</b>
            <i className="dot" aria-hidden="true" style={{ position: 'absolute', left: 0, bottom: -1, height: 3, width: `${((values[i] ?? 0) / max) * 100}%`, borderRadius: 0 }} />
          </div>
        ))}
      </Slide>
      {values.some(v => v === null) && <Notice kind="err">Alcuni numeri non sono disponibili. Riprova più tardi.</Notice>}
    </Screen>
  );
}
