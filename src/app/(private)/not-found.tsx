import { Back, Head, Screen } from '@/components/ui';

export default function NotFound() {
  return (
    <Screen>
      <Back href="/">Home</Back>
      <Head title="Non c’è">Questa pagina non esiste, o non è per te. Il branco non risponde di nulla.</Head>
    </Screen>
  );
}
