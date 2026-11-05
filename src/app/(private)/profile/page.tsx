import { logout, updateProfile } from '@/app/actions';
import { requireReadyMember } from '@/lib/auth';
import { Head, Notice, Screen, Slide } from '@/components/ui';

export const metadata = { title: 'Il tuo profilo' };

export default async function Profile({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requireReadyMember();
  const { error } = await searchParams;
  const incomplete = !profile.username || !profile.display_name;
  return (
    <Screen>
      <Head title="Il tuo profilo">Come ti chiamano nel branco?</Head>
      {error && <Notice kind="err">{error === 'validation' ? 'Controlla i dati inseriti.' : 'Salvataggio non riuscito. Il nome utente potrebbe essere già in uso.'}</Notice>}
      <Slide shape="a" tone="light">
        <form action={updateProfile} className="form">
          <label htmlFor="display_name">Nome visualizzato</label><input id="display_name" name="display_name" required maxLength={80} defaultValue={profile.display_name ?? ''} />
          <label htmlFor="username">Nome utente</label><input id="username" name="username" required minLength={3} maxLength={30} pattern="[a-z0-9_]{3,30}" autoCapitalize="none" defaultValue={profile.username ?? ''} aria-describedby="username-help" />
          <small id="username-help">Da 3 a 30 caratteri: lettere minuscole, numeri e underscore.</small>
          <label htmlFor="bio">La tua bio <small>(facoltativa)</small></label><textarea id="bio" name="bio" rows={3} maxLength={500} defaultValue={profile.bio ?? ''} placeholder="Un soprannome, una frase, una storia..." />
          <div className="btn-row"><button className="btn">Salva</button></div>
        </form>
      </Slide>
      {incomplete && <form action={logout} className="btn-row" style={{ padding: '0 var(--gut)' }}><button className="btn ghost">Esci</button></form>}
    </Screen>
  );
}
