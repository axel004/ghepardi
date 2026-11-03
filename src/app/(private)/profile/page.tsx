import { logout, updateProfile } from '@/app/actions';
import { requireMember } from '@/lib/auth';
export default async function Profile({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requireMember();
  const { error } = await searchParams;
  return <main className="panel"><p className="eyebrow">🐆 GHEPARDI</p><h1>Completa il profilo</h1><p>Come ti chiamano nel branco?</p>
    {error && <p role="alert" className="error">{error === 'validation' ? 'Controlla i dati inseriti.' : 'Salvataggio non riuscito. Il nome utente potrebbe essere già in uso.'}</p>}
    <form action={updateProfile} className="form"><label htmlFor="display_name">Nome visualizzato</label><input id="display_name" name="display_name" required maxLength={80} defaultValue={profile.display_name ?? ''} />
    <label htmlFor="username">Nome utente</label><input id="username" name="username" required minLength={3} maxLength={30} pattern="[a-z0-9_]{3,30}" defaultValue={profile.username ?? ''} aria-describedby="username-help" /><small id="username-help">Da 3 a 30 caratteri: lettere minuscole, numeri e underscore.</small><button>Salva</button></form><form action={logout}><button className="secondary">Esci</button></form></main>;
}
