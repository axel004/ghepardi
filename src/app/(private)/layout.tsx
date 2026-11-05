import Link from 'next/link';
import { requireMember } from '@/lib/auth';
import { Icon } from '@/components/ui';
import { Tabs } from '@/components/tabs';

export const dynamic = 'force-dynamic';

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { profile, supabase } = await requireMember();
  if (profile.must_change_password || !profile.username || !profile.display_name) return <div className="app"><a className="skip" href="#main">Vai al contenuto</a>{children}</div>;
  const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('recipient_id', profile.id).is('read_at', null);
  return (
    <div className="app">
      <a className="skip" href="#main">Vai al contenuto</a>
      <header className="bar">
        <Link href="/" className="brand" aria-label="Ghepardi, home"><span className="mask m" aria-hidden="true" /><span className="mask w" aria-hidden="true" /></Link>
        <Link href="/notifications" className="bell" aria-label={count ? `Notifiche: ${count} non lette` : 'Notifiche'} transitionTypes={['nav-forward']}>
          <Icon name="bell" />{!!count && <span className="n">{count}</span>}
        </Link>
      </header>
      {children}
      <Tabs />
    </div>
  );
}
