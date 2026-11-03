import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requireMember() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) redirect('/login?error=config');
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect('/login');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('id, username, display_name, role').eq('id', data.claims.sub).maybeSingle();
  if (profileError || !profile) redirect('/login?error=access');
  return { supabase, profile };
}
