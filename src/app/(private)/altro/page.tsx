import { logout } from '@/app/actions';
import { requireReadyMember } from '@/lib/auth';
import { Head, Row, Screen, Slide } from '@/components/ui';

export const metadata = { title: 'Altro' };

export default async function Altro() {
  const { profile } = await requireReadyMember();
  return (
    <Screen>
      <Head title="Altro" tick="Indice">Tutto il resto del club, a una riga di distanza.</Head>
      <Slide title="Il club" shape="a">
        <Row when="Oggi" title="Attività" sub="Le novità, in ordine di arrivo" href="/activity" />
        <Row when="Voto" title="Sondaggi" sub="Una scelta a testa, voto segreto" href="/polls" />
        <Row when="Frasi" title="Citazioni" sub="Fuori contesto, per sempre" href="/quotes" />
        <Row when="Data" title="Eventi" sub="Cene, viaggi e altre scuse" href="/events" />
      </Slide>
      <Slide title="Il gioco" shape="b">
        <Row when="Punti" title="Classifiche" sub="Numeri ufficialissimi" href="/rankings" />
        <Row when="Mese" title="Format mensili" sub="Le rubriche del branco" href="/monthly" />
        <Row when="Anno" title="Premi" sub="I riconoscimenti, più o meno meritati" href="/awards" />
        <Row when="Gloria" title="Hall of Fame" sub="Le imprese leggendarie" href="/hall-of-fame" />
        <Row when="Onta" title="Hall of Shame" sub="Quelle che nessuno dimentica" href="/hall-of-shame" />
      </Slide>
      <Slide title="I numeri" shape="c">
        <Row when="Totale" title="Statistiche" sub="Da quando il club è online" href="/stats" />
        <Row when="Annuale" title="Wrapped" sub="Il vostro anno insieme" href="/wrapped" />
      </Slide>
      <Slide title="Tu" shape="a" tone="light">
        <Row when="Posta" title="Notifiche" sub="Menzioni e risposte" href="/notifications" />
        <Row when="Io" title="Profilo" sub={`@${profile.username}`} href="/profile" />
        {profile.role === 'admin' && <Row when="Admin" title="Pannello admin" sub="Post, album, membri" href="/admin" />}
        <form action={logout} className="btn-row"><button className="btn ghost">Esci</button></form>
      </Slide>
    </Screen>
  );
}
