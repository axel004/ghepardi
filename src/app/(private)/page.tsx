import { redirect } from 'next/navigation';
import { logout } from '@/app/actions';
import { requireMember } from '@/lib/auth';
export default async function Home() {
  const { profile } = await requireMember();
  if (!profile.username || !profile.display_name) redirect('/profile');
  return <main className="panel"><div className="brand">🐆</div><p className="eyebrow">PRIVATE MEMBERS CLUB</p><h1>Benvenuto nei Ghepardi, {profile.display_name}.</h1><p>Le fondamenta del tuo club privato sono pronte.</p><form action={logout}><button>Esci</button></form></main>;
}
