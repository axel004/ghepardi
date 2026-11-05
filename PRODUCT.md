# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Next.js 16 (App Router, React 19) + Supabase, deploy su Vercel via GitHub Actions. Confermato dall'utente dopo la domanda sullo stack: la preoccupazione era che il risultato non fosse "troppo basic" nello stile. Next.js non limita il livello di design (View Transitions, animazioni su transform/opacity, gesti nativi). Il codice UI esistente è solo reference di contenuto e viene riscritto da zero; si conservano schema dati, policy RLS, auth e pipeline di deploy. Mobile web resta `web`.

## Users
Circa 5-20 amici, membri di un club privato. Aprono l'app dal telefono (riferimento 390px) più volte al giorno, in brevi momenti: guardare cosa è successo, commentare, reagire, votare, rivedere foto. Un admin (uno o pochi) crea gli account e pubblica quasi tutto il contenuto. Non c'è registrazione pubblica.

## Product Purpose
Una bacheca privata e quotidiana per il gruppo: memoria condivisa e rituali del club (post, foto, sondaggi, citazioni, eventi, classifiche, premi, Hall of Fame/Shame, format mensili, statistiche, Wrapped annuale). Successo: gli amici la aprono ogni giorno volentieri, e ciò che è privato resta privato.

## Positioning
Non è un social network né una chat: è l'archivio e il palcoscenico di un gruppo chiuso e specifico, con le sue istituzioni ironiche (Hall of Shame, premi, format mensili). Nessun altro prodotto ha quegli amici, quei premi e quelle citazioni.

## Operating Context
- Accesso solo su invito: l'admin crea l'account con la sola email, il sito mostra una password temporanea una sola volta, il membro la cambia al primo accesso e solo dopo vede il resto dell'app.
- Profili disattivati (`status = disabled`) non possono usare il sito né i dati protetti.
- Uso quotidiano da telefono, spesso a una mano, in momenti brevi.

## Capabilities and Constraints
Sezioni da costruire (tutte in italiano): Login e cambio password al primo accesso; Home; Post (commenti e reazioni, menzioni); Gallery (album e foto); Sondaggi; Citazioni (con voti); Eventi; Classifiche; Attività; Il branco (membri e profili); Format mensili; Premi; Hall of Fame e Hall of Shame; Statistiche; Wrapped annuale; Notifiche; Profilo; area Admin (post, album, membri).

Ruoli e regole da mantenere (dal repo):
- Ruoli `admin` e membro. L'admin crea e modifica post, album, foto, sondaggi, classifiche, eventi, premi, Hall, format mensili e account. I membri leggono, commentano, reagiscono e votano.
- Le foto sono private: servite solo ai membri abilitati, via route autenticata. Vengono convertite in JPEG, max 1920px sul lato maggiore, senza originale né metadati. Un album si elimina solo dopo aver rimosso le foto; eliminare una foto la toglie anche dalle copertine dei post; le 50 foto più recenti sono selezionabili come copertina.
- Sondaggi: da 2 a 6 opzioni, un voto per membro, voto segreto (ciascuno vede solo il proprio; i risultati aggregati sono visibili a tutti), chiusura manuale o per data.
- Ogni lettura richiede password già cambiata e profilo attivo. Signup pubblico e accesso anonimo restano disabilitati.
- Non esistono ancora reset password né disattivazione dal pannello admin: sono interventi dell'operatore su Supabase.
- Da decidere (non confermato): estensione dei diritti di scrittura dei membri oltre il repo.

## Brand Commitments
- Nome: Ghepardi. Sigla/slogan nel repo: "GHEPARDI · PRIVATE BY NATURE", "PRIVATE CLUB".
- Asset vincolanti: loghi in `public/brand` (`ghepardi-logo-scritta.png`, `logo-full.png`, `logo-icon.png`, `mark.png`, `wordmark.png`) e icone in `src/app` (`icon.png`, `apple-icon.png`, `favicon.ico`). Il logo è nero, il muso di un ghepardo di profilo con due macchie in negativo, e la scritta "ghepardi" minuscola in un grotesque tondo e pesante. Il modo di usare il logo è libero.
- Voce: italiano, tono da amici, ironico, mai sguaiato.
- Evocare il tema ghepardo/animalier con intelligenza e senza stamparlo ovunque (vincolo di direzione, non decisione visiva).

## Evidence on Hand
Schema e policy in `supabase/migrations` (profili, post, commenti, reazioni, album, foto, sondaggi, classifiche, eventi, citazioni, format, premi, hall, notifiche, Wrapped), pagine in `src/app/(private)`, README. Nessun contenuto reale, foto o dati di club: contenuti di prova da non spacciare per reali.

## Product Principles
1. Privato prima di tutto: foto e voti non devono mai trapelare, e l'interfaccia lo rende evidente e rassicurante.
2. Un'app da aprire ogni giorno: la novità del giorno è subito leggibile, senza rumore.
3. Ironia affiatata: si ride con il gruppo, mai contro qualcuno; l'ironia sta nei testi e nelle istituzioni del club.
4. Il gruppo è piccolo: ogni persona conta. Le persone prima dei numeri, nessun linguaggio da community di massa.
5. Il telefono è il device: pollice, una mano, schermo piccolo, connessione variabile.

## Accessibility & Inclusion
WCAG AA: contrasti, focus visibile, uso da tastiera, aree di tocco da 44px, `prefers-reduced-motion` rispettato. Interfaccia interamente in italiano.
