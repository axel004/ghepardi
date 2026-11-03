import { acceptInvite } from '@/app/actions';
export default async function Invite({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="panel"><p className="eyebrow">🐆 GHEPARDI</p><h1>Sei stato invitato</h1><p>Inserisci la tua email e il codice ricevuto.</p>
    {error && <p className="error" role="alert">Codice non valido o scaduto. Contatta un amministratore.</p>}
    <form action={acceptInvite} className="form"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" maxLength={254} required /><label htmlFor="code">Codice di invito</label><input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required /><button>Accetta invito</button></form></main>;
}
