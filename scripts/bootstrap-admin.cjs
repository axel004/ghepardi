const { execFileSync } = require('node:child_process');
const { createClient } = require('@supabase/supabase-js');
const { GHEPARDI_BOOTSTRAP_EMAIL: email, GHEPARDI_BOOTSTRAP_PASSWORD: password, GHEPARDI_PROJECT_REF: ref } = process.env;
if (!email || !password || password.length < 12 || !/^[a-z0-9]{20}$/.test(ref || '')) {
  console.error('Dati mancanti o password più corta di 12 caratteri.'); process.exit(1);
}
const keys = JSON.parse(execFileSync('supabase', ['projects', 'api-keys', '--project-ref', ref, '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
const secret = keys.find((key) => key.type === 'secret')?.api_key;
if (!secret) { console.error('Chiave server non disponibile.'); process.exit(1); }
const admin = createClient(`https://${ref}.supabase.co`, secret, { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw new Error('Creazione non riuscita: verifica che l’email non sia già registrata.');
  const id = created.data.user.id;
  const updated = await admin.from('profiles').update({ role: 'admin', must_change_password: false }).eq('id', id).select('id, role, must_change_password').single();
  if (updated.error || updated.data?.role !== 'admin' || updated.data.must_change_password) {
    const profile = await admin.from('profiles').delete().eq('id', id);
    const user = profile.error ? null : await admin.auth.admin.deleteUser(id);
    if (profile.error || user?.error) throw new Error(`Promozione non riuscita; controlla e rimuovi manualmente l’utente di prova ${id}.`);
    throw new Error('Promozione non riuscita; account appena creato rimosso.');
  }
  console.log('Account amministratore creato. Puoi accedere alla preview.');
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
