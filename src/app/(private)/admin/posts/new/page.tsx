import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { PostForm } from '../post-form';
export default async function NewPost({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  return <main className="panel"><p className="eyebrow">🐆 GHEPARDI</p><h1>Nuovo post</h1>{error && <p className="error" role="alert">Controlla i dati e riprova.</p>}<PostForm /><p><Link href="/admin/posts">← I post</Link></p></main>;
}
