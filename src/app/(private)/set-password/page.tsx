import { setPassword } from '@/app/actions';

export const metadata = { title: 'Scegli una password' };

export default async function SetPassword({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="login" id="main">
      <span className="mask w" role="img" aria-label="Ghepardi" />
      <h1 className="lbl">Prima di entrare: scegli una password</h1>
      <p>Quella temporanea vale una volta sola. Usa almeno 8 caratteri.</p>
      {error && <div className="notice err" role="alert"><b>Non riuscito.</b><span>Password non valida o salvataggio non riuscito.</span></div>}
      <section className="slide a" aria-label="Nuova password">
        <form action={setPassword} className="form">
          <label htmlFor="password">Nuova password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
          <label htmlFor="confirmation">Ripeti la password</label>
          <input id="confirmation" name="confirmation" type="password" autoComplete="new-password" required minLength={8} maxLength={72} />
          <div className="btn-row"><button className="btn">Continua</button></div>
        </form>
      </section>
    </main>
  );
}
