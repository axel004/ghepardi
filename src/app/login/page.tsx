import { login } from '@/app/actions';
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error === 'config' ? 'Configura Supabase per accedere.' : error === 'access' ? 'Accesso non disponibile. Contatta un amministratore.' : error === 'invite' ? 'Invito scaduto o non valido. Contatta un amministratore.' : error ? 'Email o password non valide.' : '';
  return <main className="panel"><div className="brand">🐆</div><p className="eyebrow">PRIVATE MEMBERS CLUB</p><h1>GHEPARDI</h1><p>La memoria del branco, in un posto solo.</p>
    {message && <p className="error" role="alert">{message}</p>}
    <form action={login} className="form"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
    <label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={1024} /><button>Entra nel branco</button></form>
  </main>;
}
