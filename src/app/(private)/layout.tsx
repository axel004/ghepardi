import { requireMember } from '@/lib/auth';
import { logout } from '@/app/actions';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireMember();
  if (profile.must_change_password || !profile.username || !profile.display_name) return children;
  return <div className="app-shell"><header className="site-header"><Link href="/" className="site-brand" aria-label="Ghepardi, home"><span>🐆</span><span>GHEPARDI<small>PRIVATE CLUB</small></span></Link><nav className="site-nav" aria-label="Navigazione principale"><Link href="/">Home</Link><Link href="/posts">Post</Link><Link href="/gallery">Gallery</Link><Link href="/polls">Sondaggi</Link><Link href="/rankings">Classifiche</Link><Link href="/events">Eventi</Link><Link href="/quotes">Citazioni</Link><Link href="/stats">Statistiche</Link><Link href="/members">Branco</Link>{profile.role === 'admin' && <Link href="/admin">Admin</Link>}</nav><div className="site-account"><Link href="/profile">👤 <span>{profile.display_name}</span></Link><form action={logout}><button className="logout-button">Esci</button></form></div></header>{children}<footer className="site-footer">🐆 GHEPARDI · PRIVATE BY NATURE</footer></div>;
}
