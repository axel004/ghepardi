import Link from 'next/link';
import { requireReadyMember } from '@/lib/auth';

export default async function Members() {
  const { supabase } = await requireReadyMember();
  const { data, error } = await supabase.from('profiles').select('username,display_name,bio,role').eq('status', 'active').not('username', 'is', null).not('display_name', 'is', null).order('display_name');
  return <main className="panel section-panel"><p className="eyebrow">LA NOSTRA SQUADRA</p><h1>Il branco 🐆</h1><p>Le facce dietro alle storie.</p>{error ? <p className="error">Impossibile caricare i membri. Riprova più tardi.</p> : !data?.length ? <p>Il branco si sta formando.</p> : <div className="member-grid">{data.map(member => <Link href={`/members/${member.username}`} className="member-card" key={member.username}><span>🐆</span><div><strong>{member.display_name}</strong><small>@{member.username}{member.role === 'admin' ? ' · Admin' : ''}</small>{member.bio && <p className="excerpt">{member.bio}</p>}</div><b>↗</b></Link>)}</div>}</main>;
}
