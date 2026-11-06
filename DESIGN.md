---
name: Ghepardi
description: Il club privato del branco, impaginato come un orario tascabile.
colors:
  ocra-letto: "#d9a21b"
  inchiostro: "#1e2428"
  inchiostro-tenue: "#3a3210"
  avorio: "#f4f0e6"
  avorio-tenue: "#cfc9b8"
  grigio-prosa: "#4a4a42"
  ocra-accesa: "#f0b92a"
  vermiglio: "#b5391f"
  vermiglio-su-vetro: "#ff8a6b"
  letto-spento: "#100f0c"
  vetro-spento: "#2a2822"
  pannello-spento: "#38362e"
  campo-spento: "#1c1b16"
  ocra-spenta: "#e8b93c"
typography:
  body:
    fontFamily: "Libre Franklin, Franklin Gothic Medium, Arial Narrow, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.4
  title:
    fontFamily: "Libre Franklin, Franklin Gothic Medium, Arial Narrow, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.4
  label:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    letterSpacing: "0.08em"
  moment:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(4rem, 22vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.85
rounded:
  none: "0px"
spacing:
  gap: "10px"
  gutter: "16px"
  touch: "44px"
  lean: "22px"
  lean-steep: "38px"
components:
  button-primary:
    backgroundColor: "{colors.inchiostro}"
    textColor: "{colors.ocra-letto}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  button-on-glass:
    backgroundColor: "{colors.ocra-accesa}"
    textColor: "{colors.inchiostro}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  slide-dark:
    backgroundColor: "{colors.inchiostro}"
    textColor: "{colors.avorio}"
    rounded: "{rounded.none}"
  slide-light:
    backgroundColor: "{colors.avorio}"
    textColor: "{colors.inchiostro}"
    rounded: "{rounded.none}"
  plate:
    backgroundColor: "{colors.inchiostro}"
    textColor: "{colors.ocra-letto}"
    rounded: "{rounded.none}"
  input:
    backgroundColor: "{colors.avorio}"
    textColor: "{colors.inchiostro}"
    rounded: "{rounded.none}"
    height: "44px"
---

# Design System: Ghepardi

## Overview

**Creative North Star: "L'orario tascabile"**

L'app si legge come l'orario tascabile di una compagnia aerea del 1971 steso su un tavolo luminoso: un letto ocra, vetrini tagliati in obliquo, righe d'orario. L'ocra è il colore del manto, ma il ghepardo non è mai disegnato: sta nell'inclinazione dei piani e nel ritmo secco del movimento, lunga immobilità e poi scatto.

La densità è quella di un orario: molte righe, poco ornamento, un solo corpo per tutto ciò che si legge. Il rango si costruisce con peso, maiuscole, inversione e filetti. L'unica eccezione è il numero che è la notizia. L'ironia sta nei testi, mai nella grafica.

Rifiuti confermati dal committente: macchie disegnate, rosette, muso del logo ingrandito, ritagli a forma animale, pattern a pois; griglie di card uguali con fascia di testo; crema con serif, nero con neon, card arrotondate, gradienti, ombre decorative, emoji al posto delle icone.

**Key Characteristics:**
- Un corpo solo, un'eccezione sola.
- Piani piatti tagliati in obliquo, contenuto sempre dritto.
- L'inclinazione porta un significato: dice se una cosa è viva.
- Nessun raggio, nessuna ombra, nessun gradiente.
- Azioni frequenti rapide, respiro solo nei momenti rari.

## Colors

Un letto saturo che possiede la superficie, con vetrini d'inchiostro e pannelli d'avorio sopra.

### Primary
- **Ocra letto:** il fondo di tutta l'app in light e il testo delle piastre inverse. È il manto reso materiale.
- **Inchiostro:** testo sul letto, vetrini scuri, piastra, barra a tab.

### Secondary
- **Ocra accesa:** titoli di vetrino e bottoni sui vetrini scuri, barre dei risultati, focus sui piani scuri, segno pieno.

### Tertiary
- **Vermiglio:** barrato ed errori sui fondi chiari. Non arriva ad AA sul letto ocra, quindi non si usa lì come testo e non porta mai significato da solo: il segno cambia anche forma.
- **Vermiglio su vetro:** lo stesso ruolo sui vetrini scuri e nel tema scuro.

### Neutral
- **Avorio:** testo sui vetrini, fondo dei vetrini chiari, dei pannelli di prosa e dei campi.
- **Avorio tenue:** testo secondario sui vetrini scuri.
- **Grigio prosa:** testo secondario su avorio.
- **Inchiostro tenue:** testo secondario sul letto.
- **Letto spento, vetro spento, pannello spento, campo spento, ocra spenta:** il tema scuro è il tavolo luminoso a lampada spenta. Il letto scende al quasi nero, l'ocra spenta diventa testo e piastra.

### Named Rules
**La Regola del Letto.** La superficie è colore, non neutro con un accento: mai sostituire il letto ocra con un grigio o un bianco in light.

**La Regola del Colore Mai Solo.** Nessuno stato si legge dal solo colore: pieno, vuoto, barrato cambiano forma.

## Typography

**Body Font:** Libre Franklin (con Franklin Gothic Medium, Arial Narrow)
**Label Font:** Barlow Condensed (con Arial Narrow)

**Character:** un grotesk umanista da orario per leggere e un condensato per le etichette di colonna. Insieme fanno l'aria da documento di servizio che rende ironico tutto il resto.

### Hierarchy
- **Moment:** il numero che è la notizia. Solo: giorni al prossimo evento, anni di Premi e Hall, punti del primo in classifica, Wrapped.
- **Title:** titoli di riga, peso pieno, stesso corpo del testo.
- **Body:** tutto il resto; misura massima 62ch nei pannelli di prosa.
- **Label:** condensato maiuscolo con tracking, per la colonna del tempo, i titoli di vetrino, i bottoni e la barra a tab.

### Named Rules
**La Regola del Corpo Unico.** Tutto ciò che si legge ha un solo corpo. Il rango viene da peso, maiuscole, inversione e filetti. Non aggiungere un secondo corpo per un titolo.

**La Regola del Numero.** La sola eccezione è un numero che è già la notizia. Mai una parola in corpo grande.

## Layout

Colonna singola, larga al massimo 560px, 640px da 700px in su, con margini da 16px e 10px tra i piani. Barra in alto fissa con logo, campana e riga di tacche; barra a tab fissa in basso a cinque voci. I vetrini variano margini fra tre sagome, così la pila non è mai una griglia di elementi uguali. Le righe usano tre celle: tempo a sinistra in una colonna da 4,6rem, contenuto, segno di navigazione a destra. Le foto stanno in copertine a larghezza alternata, in strisce orizzontali con snap, o in due colonne a misura libera.

## Elevation & Depth

Niente ombre. La profondità viene dall'ordine dei piani e dal contrasto fra letto, vetro e avorio. Un vetrino può sovrapporsi a una foto per sottrazione di margine, come nel post guida di Home.

### Named Rules
**La Regola del Piatto.** Nessuna ombra, nessuna sfocatura, nessun gradiente. Sono piani stampati, non oggetti che galleggiano.

## Shapes

Angoli sempre vivi. La forma ricorrente è il parallelogramma, tagliato con `clip-path` a quattro vertici con spostamento fisso, così il contenuto resta dritto e nitido. I radio sono l'unica forma rotonda, perché devono leggersi come scelta singola.

### Named Rules
**La Regola del Vetrino Vivo.** Il vetrino pende finché la cosa è viva: inclinazione normale di default, maggiore se scade entro un giorno, dritto se è chiusa o passata. Non usare l'inclinazione come puro stile.

## Components

### Buttons
- **Shape:** angoli vivi, alti 44px.
- **Primary:** piastra d'inchiostro con etichetta ocra; ocra accesa sui vetrini scuri; inchiostro su avorio nei vetrini chiari.
- **Ghost:** solo contorno da 2px, per le azioni secondarie.
- **Stati:** alla pressione scendono di 2px; durante l'invio si disabilitano e dichiarano cosa sta succedendo.

### Vetrini
- **Scuri o chiari:** il tono separa ciò che è da fare, su avorio, da ciò che è già archiviato o da leggere, su inchiostro.
- **Regola:** niente vetrini dentro vetrini; le voci all'interno sono righe separate da filetti.

### Piastra inversa
- **Uso:** un solo elemento per schermata che deve staccarsi, come il prossimo evento o il titolo di un post.
- **Focus:** contorno interno, perché il taglio cancellerebbe quello esterno.

### Segni di stato
- **Forma:** parallelogramma basso, pieno, vuoto o barrato; non sembra una casella da spuntare.
- **Posizione:** nella colonna sinistra, mai nella cella del segno di navigazione.

### Inputs / Fields
- **Style:** fondo avorio, contorno da 2px, corpo da 16px, alti almeno 44px.
- **Focus:** contorno da 3px del colore che contrasta col piano. Il cursore di testo è vermiglio.

### Navigation
Barra a tab con cinque voci, icona più etichetta condensata. L'indicatore del tab si sposta al tocco, senza aspettare il server. Indietro in alto a sinistra con la pagina di provenienza. Le icone sono SVG disegnati, 24px, tratto 1,8 con estremi squadrati.

### Riga di tacche
Sotto la barra in alto: una riga a cadenza di falcata, con gruppi di barrette e un cursore mosso dallo scroll. Dice dove sei nella pagina.

### Movimento
Solo trasformazioni e opacità, con la curva di progetto. Le schermate scorrono di lato lungo l'inclinazione in 240ms, con barra e tab ferme. Le foto proseguono da una schermata all'altra con un morph. Toccando un piano, gli altri si abbassano. Lo scatto, breve e secco, si concede solo tornando dopo almeno 30 minuti con qualcosa di nuovo, e nell'apertura di Wrapped. Con movimento ridotto restano dissolvenze brevi senza spostamenti.

### Amministrazione
Tutti i controlli admin di un blocco stanno in un solo «Gestisci», in tono basso. Ogni eliminazione chiede conferma, con spazio vuoto attorno.

## Do's and Don'ts

### Do:
- **Do** tenere il tempo nella colonna sinistra: è un orario, le cose hanno un quando.
- **Do** far nascere il rango da peso, maiuscole, inversione e filetti, nell'ordine.
- **Do** dare a ogni sezione speciale la sua composizione, come Wrapped e le Hall, invece di ripetere la pila di righe.
- **Do** tenere le animazioni delle azioni frequenti sotto i 300ms.

### Don't:
- **Don't** usare macchie disegnate, rosette, pattern a pois, ritagli a forma animale o il muso del logo ingrandito.
- **Don't** usare griglie di card uguali con fascia di testo.
- **Don't** usare crema con serif, nero con neon, card arrotondate, gradienti, ombre decorative.
- **Don't** usare emoji o caratteri di testo al posto delle icone: il valore salvato delle reazioni è un'emoji, ma a schermo va sempre l'icona disegnata.
- **Don't** introdurre un secondo corpo di testo per i titoli.
- **Don't** animare proprietà diverse da trasformazioni e opacità nel codice dell'app.
