import { requireAdmin } from '@/lib/auth';
import { PostForm } from '../post-form';
import { Back, Head, Notice, Screen, Slide } from '@/components/ui';

export default async function NewPost({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  return (
    <Screen>
      <Back href="/admin/posts">I post</Back>
      <Head title="Nuovo post" />
      {error && <Notice kind="err">Controlla i dati e riprova.</Notice>}
      <Slide shape="a" tone="light"><PostForm /></Slide>
    </Screen>
  );
}
