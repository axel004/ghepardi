import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireReadyMember } from '@/lib/auth';

export default async function Member({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { supabase, profile } = await requireReadyMember();
  const { data: member, error } = await supabase.from('profiles').select('id,username,display_name,bio,role').eq('username', username).eq('status', 'active').maybeSingle();
  if (error) return <main className="panel"><p className="error">Impossibile caricare il profilo. Riprova più tardi.</p><Link href="/members">← Il branco</Link></main>;
  if (!member) notFound();
  const awards = await supabase.from('awards').select('id,title,award_year').eq('member_id', member.id).order('award_year', { ascending: false }).order('id', { ascending: false });
  return <main className="panel"><Link href="/members">← Il branco</Link><p className="eyebrow">🐆 MEMBRO DEL BRANCO</p><h1>{member.display_name}</h1><p>@{member.username}{member.role === 'admin' ? ' · Admin' : ''}</p><p className="post-content">{member.bio || 'Ancora nessuna presentazione.'}</p>{profile.username === member.username && <Link href="/profile">Modifica il tuo profilo →</Link>}<h2>🏅 Premi</h2>{awards.error ? <p className="error">Impossibile caricare i premi.</p> : !awards.data?.length ? <p>Ancora nessun premio.</p> : <ul>{awards.data.map(award => <li key={award.id}>{award.title} · {award.award_year}</li>)}</ul>}<Link href="/awards">Tutti i premi →</Link></main>;
}
