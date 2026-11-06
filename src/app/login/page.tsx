import { login } from '@/app/actions';
import { Icon } from '@/components/ui';
import { Submit } from '@/components/submit';

export const metadata = { title: 'Accedi' };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error === 'config' ? 'Configura Supabase per accedere.' : error === 'access' ? 'Accesso non disponibile. Contatta un amministratore.' : error === 'invite' ? 'Invito scaduto o non valido. Contatta un amministratore.' : error ? 'Email o password non valide.' : '';
  return (
    <main className="login" id="main">
      <h1 className="sr">Ghepardi, accesso al club</h1>
      <span className="mask w" aria-hidden="true" />
      <p>La memoria del branco, in un posto solo. Si entra solo su invito.</p>
      {message && <div className="notice err" role="alert"><b>Non riuscito.</b><span>{message}</span></div>}
      <section className="slide a" aria-label="Accesso">
        <form action={login} className="form">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required maxLength={254} />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={1024} />
          <div className="btn-row"><Submit><Icon name="lock" />Entra nel branco</Submit></div>
        </form>
      </section>
    </main>
  );
}
