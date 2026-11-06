---
version: 1
slug: "src-app-layout-tsx"
primary_target: "src/app/layout.tsx"
related_targets: []
---

## Surface
Ghepardi, webapp mobile (390px) del club privato. Modalità Operate, uso quotidiano da telefono. Tutta l'app in italiano.

## Direction contract

THESIS: L'app è un orario tascabile: un solo corpo di carattere per tutto ciò che si legge, il rango lo fanno peso, maiuscole, inversione e filetti; una sola eccezione, il numero che è la notizia (giorni al prossimo evento, anni della Hall, primo in classifica, Wrapped). Rifiuta la griglia di card uguali e la crema con serif. Il manto è colore e ritmo secco, non disegno.

OWN-WORLD: Fondo ocra (letto luminoso), vetrini scuri color inchiostro con testo avorio, pannelli di prosa opachi chiari, rosso vermiglio per barrato/errore, verde bosco per confermato. Un solo corpo (16px), grotesk umanista per il testo e condensato per le etichette. Stato come segno inclinato non cliccabile: pieno, vuoto, barrato. Blocchi a parallelogramma tagliati da clip-path con il contenuto dritto: il vetrino pende finché la cosa è viva, sta dritto se chiusa o passata, pende di più se scade entro un giorno. Navigazione e controlli restano standard.

STORY: Il membro apre, vede in due secondi cosa c'è di nuovo, vota o commenta, e torna alla vita. Capisce che è un posto privato: foto e voti non escono.

FIRST VIEWPORT: Barra in alto con logo, campana e riga di tacche della posizione. La data come testata. Il post più recente guida con la foto e un vetrino scuro sovrapposto, poi il vetrino chiaro Da votare, poi la piastra inversa col numero di giorni al prossimo evento. Barra a tab in basso con cinque voci e indicatore che si sposta al tocco.

FORM: rw-timetable-slide-rack, scelto dall'utente come challenger (seed:a5b824fd8f318dfe). Traduzioni dichiarate: niente gradienti (la luce è un cambio di opacità di piani piatti: gli altri piani si abbassano quando ne tocchi uno), controlli standard, vetrini di larghezze diverse e non righe di riquadri uguali.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Open decisions
Decisi dall'agente su delega dell'utente: letto spento in dark, corpo 16px, Libre Franklin e Barlow Condensed. Da fare: stato nuovo-dall'ultima-visita.
