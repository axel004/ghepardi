# GHEPARDI — Sprint 0

Fondamenta locali Next.js + Supabase: login email/password, accettazione invito, controllo profilo attivo lato server e RLS, onboarding essenziale e pagina privata. Nessun contenuto del club, signup pubblico o pannello inviti è ancora implementato.

## Avvio

Servono Node.js, npm, Docker e Supabase CLI. Usare progetti separati per sviluppo e produzione.

```sh
npm install
supabase start -x realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor
```

Le porte locali sono 55421–55429. Con `supabase status` individuare API URL e chiave anon/publishable locali, copiare `.env.example` in `.env.local` e compilare la chiave. Non inserire mai la chiave service/secret in variabili `NEXT_PUBLIC_` o nel repository.

```sh
npx next dev --hostname 127.0.0.1 --port 3347
npm run lint
npm run typecheck
npm run build
supabase test db
```

Aprire http://127.0.0.1:3347. Il signup pubblico e l'accesso anonimo sono disabilitati nel config locale. L'opzione globale `auth.enable_signup` deve restare `false`, mentre `auth.email.enable_signup` è `true`: disabilitare quest'ultima impedisce anche il login email nella versione locale verificata. Per provare il login creare un utente confermato con Supabase Studio locale (Authentication > Users > Add user); il trigger crea automaticamente un profilo `member` attivo. Al primo login completare il profilo. Per disabilitare un account eseguire SQL solo da un operatore privilegiato: `update public.profiles set status = 'disabled' where id = '<UUID>';`. Promuovere un primo admin solo con SQL privilegiato: `update public.profiles set role = 'admin' where id = '<UUID>';`. Non esiste un'azione applicativa per modificare ruolo o stato; prima di realizzarla occorre proteggere l'ultimo admin in una transazione.

Per un invito di prova, usare Authentication > Users > Invite user in Studio; l'email locale arriva nella casella di test su http://127.0.0.1:55424. Il template invia un codice monouso separato da un link privo di token; l'utente inserisce email e codice nella pagina di invito, poi sceglie una password. I codici sono inviati nel corpo della richiesta HTTPS: non attivare log dei corpi delle richieste, né acquisizioni di form da strumenti di monitoraggio.

Il test `tests/local-auth.mjs` richiede app e Supabase locali in esecuzione e le variabili `LOCAL_ANON_KEY` e `LOCAL_SERVICE_ROLE_KEY` tratte da `supabase status -o env`. Usa esclusivamente gli indirizzi locali fissati nello script, crea e rimuove account di prova e non va eseguito su ambienti remoti. Non salvare la service key nel repository.

## Prima di una preview cloud

Creare un progetto Supabase dedicato, applicare le migrazioni e configurare esplicitamente Auth: email/password attivo, signup pubblico e accesso anonimo disabilitati. Il progetto cloud gratuito richiede un provider SMTP personalizzato per modificare il template: configurarlo e copiare il template OTP dal repository prima di inviare inviti. Il template predefinito non è compatibile con questo flusso e inserisce un token nel link. Configurare Site URL, redirect, protezioni Auth e variabili di ambiente su Vercel. Verificare su preview login, invito, revoca con JWT ancora valido e tentativi diretti API. Nessuna secret key nel client. Produzione solo dopo approvazione e verifica completa.

Invio inviti dal pannello, recupero password, amministrazione e deploy non sono ancora implementati o verificati. Non usare dati reali finché non è stata verificata la sicurezza end-to-end e definito il backup.
