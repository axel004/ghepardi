# GHEPARDI

Club privato Next.js e Supabase. L'admin crea gli account senza inviare email: il sito mostra una password temporanea una sola volta; il membro la cambia al primo accesso. L'admin può scrivere post, salvarli come bozze e pubblicarli; i membri possono commentare e reagire. I profili disattivati non possono usare il sito o i dati protetti.

## Avvio locale

Servono Node.js, npm, Docker e Supabase CLI. Usare un progetto Supabase separato dalla produzione.

```sh
npm install
supabase start -x realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor
```

Copiare `.env.example` in `.env.local` e impostare URL, chiave anon/publishable e chiave server locali usando `supabase status`. La chiave `SUPABASE_SECRET_KEY` aggira RLS: solo server, mai in variabili `NEXT_PUBLIC_`, Git, log o browser. La chiave locale service_role è accettata per i test.

```sh
npx next dev --hostname 127.0.0.1 --port 3347
npm run lint
npm run typecheck
npm run build
supabase test db
```

Il signup pubblico e l'accesso anonimo devono restare disabilitati in Supabase. L'opzione globale `auth.enable_signup` è `false`, mentre `auth.email.enable_signup` è `true`: disabilitare quest'ultima impedisce anche il login email nella versione locale verificata.

## Account

Il primo admin va creato da un operatore con accesso autorizzato al progetto Supabase. Su Windows, da PowerShell, usare `scripts/bootstrap-admin.ps1 -Email <email> -ProjectRef <ref>`; la password viene chiesta senza mostrarla, non passata sulla riga di comando. Lo script crea solo un nuovo utente e non promuove account preesistenti.

Da `/admin` l'admin può creare un membro inserendo l'email. Comunicare le credenziali temporanee tramite un canale concordato, senza pubblicarle. La password temporanea è visibile una sola volta. Il membro deve cambiarla prima di vedere altri profili o usare l'app. Al momento il pannello non dispone di reset password o disattivazione: un operatore deve intervenire nella dashboard Supabase. Per disabilitare un account, con SQL privilegiato: `update public.profiles set status = 'disabled' where id = '<UUID>';`. Prima di aggiungere operazioni di modifica ruolo occorre proteggere l'ultimo admin in una transazione.

I test `tests/local-auth.mjs` e `tests/local-posts.mjs` richiedono app e Supabase locali in esecuzione e le variabili `LOCAL_ANON_KEY` e `LOCAL_SERVICE_ROLE_KEY` tratte da `supabase status -o env`. Creano e rimuovono dati di prova esclusivamente in locale.

## Preview e produzione

Configurare la chiave server come secret Vercel solo negli ambienti appropriati; le chiavi pubbliche non sostituiscono le policy RLS. La preview Vercel protetta richiede un account autorizzato su Vercel; il sito di produzione consente l'accesso con le sole credenziali GHEPARDI. Le future policy per i contenuti devono controllare `private.has_changed_password()`, oltre a stato e ruolo. Il progetto Supabase è attualmente condiviso tra preview e produzione: usare solo dati di prova nelle verifiche e prevedere un ambiente separato prima di cambiamenti rischiosi. Definire e verificare un backup dei dati.
