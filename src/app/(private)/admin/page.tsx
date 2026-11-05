import { requireAdmin } from '@/lib/auth';
import { MemberForm } from './member-form';
import { Back, Head, Row, Screen, Slide } from '@/components/ui';

export const metadata = { title: 'Admin' };

export default async function AdminPage() {
  await requireAdmin();
  return (
    <Screen>
      <Back href="/altro">Altro</Back>
      <Head title="Pannello admin">Post, album, membri e tutto ciò che solo tu puoi toccare.</Head>
      <Slide title="Contenuti" shape="a">
        <Row when="Post" title="Gestisci post" href="/admin/posts" />
        <Row when="Foto" title="Gestisci gallery" href="/admin/gallery" />
        <Row when="Voto" title="Gestisci sondaggi" href="/polls" />
        <Row when="Punti" title="Gestisci classifiche" href="/rankings" />
        <Row when="Data" title="Gestisci eventi" href="/events" />
        <Row when="Mese" title="Gestisci format mensili" href="/monthly" />
        <Row when="Anno" title="Gestisci premi" href="/awards" />
        <Row when="Gloria" title="Gestisci Hall of Fame" href="/hall-of-fame" />
        <Row when="Onta" title="Gestisci Hall of Shame" href="/hall-of-shame" />
      </Slide>
      <Slide title="Crea un membro" shape="b" tone="light">
        <p className="foot">Crea un account per un amico e consegnagli le credenziali temporanee.</p>
        <MemberForm />
      </Slide>
    </Screen>
  );
}
