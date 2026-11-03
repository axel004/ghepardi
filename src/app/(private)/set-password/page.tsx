import { setPassword } from '@/app/actions';
export default async function SetPassword({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="panel"><p className="eyebrow">🐆 GHEPARDI</p><h1>Scegli una password</h1><p>Usa almeno 8 caratteri.</p>{error && <p className="error" role="alert">Password non valida o salvataggio non riuscito.</p>}
    <form action={setPassword} className="form"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} /><label htmlFor="confirmation">Conferma password</label><input id="confirmation" name="confirmation" type="password" autoComplete="new-password" required minLength={8} maxLength={72} /><button>Continua</button></form></main>;
}
