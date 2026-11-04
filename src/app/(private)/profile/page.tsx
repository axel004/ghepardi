import { logout, updateProfile } from '@/app/actions';
import { requireReadyMember } from '@/lib/auth';
export default async function Profile({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requireReadyMember();
  const { error } = await searchParams;
  return <main className="panel"><p className="eyebrow">🐆 GHEPARDI</p><h1>Il tuo profilo</h1><p>Come ti chiamano nel branco?</p>
    {error && <p role="alert" className="error">{error === 'validation' ? 'Controlla i dati inseriti.' : 'Salvataggio non riuscito. Il nome utente potrebbe essere già in uso.'}</p>}
    <form action={updateProfile} className="form"><label htmlFor="display_name">Nome visualizzato</label><input id="display_name" name="display_name" required maxLength={80} defaultValue={profile.display_name ?? ''} />
    <label htmlFor="username">Nome utente</label><input id="username" name="username" required minLength={3} maxLength={30} pattern="[a-z0-9_]{3,30}" defaultValue={profile.username ?? ''} aria-describedby="username-help" /><small id="username-help">Da 3 a 30 caratteri: lettere minuscole, numeri e underscore.</small><label htmlFor="bio">La tua bio <small>(facoltativa)</small></label><textarea id="bio" name="bio" rows={3} maxLength={500} defaultValue={profile.bio ?? ''} placeholder="Un soprannome, una frase, una storia..." /><button>Salva</button></form>{(!profile.username || !profile.display_name) && <form action={logout}><button className="secondary">Esci</button></form>}</main>;
}
