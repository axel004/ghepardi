import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { MemberForm } from './member-form';

export default async function AdminPage() {
  await requireAdmin();
  return <main className="panel"><p className="eyebrow">🐆 GHEPARDI</p><h1>Pannello admin</h1><p><Link href="/admin/posts">📰 Gestisci post →</Link></p><p><Link href="/admin/gallery">📸 Gestisci gallery →</Link></p><h2>Crea un membro</h2><p>Crea un account per un amico e consegnagli le credenziali temporanee.</p><MemberForm /><p><Link href="/">← Torna alla home</Link></p></main>;
}
