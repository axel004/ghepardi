import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { demo, demoClient, demoProfile } from '@/lib/demo';

export async function requireMember() {
  if (demo) return { supabase: demoClient(), profile: demoProfile };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) redirect('/login?error=config');
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect('/login');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('id, username, display_name, bio, role, must_change_password').eq('id', data.claims.sub).maybeSingle();
  if (profileError || !profile) redirect('/login?error=access');
  return { supabase, profile };
}

export async function requireReadyMember() {
  const member = await requireMember();
  if (member.profile.must_change_password) redirect('/set-password');
  return member;
}

export async function requireAdmin() {
  const member = await requireReadyMember();
  if (member.profile.role !== 'admin') redirect('/');
  return member;
}
