'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireMember, requireReadyMember } from '@/lib/auth';

export async function login(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password || email.length > 254 || password.length > 1024) redirect('/login?error=credentials');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) redirect('/login?error=config');
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) redirect('/login?error=credentials');
  redirect('/');
}
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
export async function updateProfile(formData: FormData) {
  const { supabase, profile } = await requireReadyMember();
  const username = formData.get('username');
  const displayName = formData.get('display_name');
  const bio = formData.get('bio');
  if (typeof username !== 'string' || !/^[a-z0-9_]{3,30}$/.test(username) || typeof displayName !== 'string' || !displayName.trim() || displayName.trim().length > 80 || (bio !== null && (typeof bio !== 'string' || bio.length > 500))) redirect('/profile?error=validation');
  const { error } = await supabase.from('profiles').update({ username, display_name: displayName.trim(), bio: typeof bio === 'string' ? bio.trim() || null : profile.bio }).eq('id', profile.id);
  if (error) redirect('/profile?error=save');
  redirect('/');
}

export async function setPassword(formData: FormData) {
  const { supabase } = await requireMember();
  const password = formData.get('password');
  const confirmation = formData.get('confirmation');
  if (typeof password !== 'string' || password.length < 8 || password.length > 72 || password !== confirmation) redirect('/set-password?error=validation');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect('/set-password?error=save');
  redirect('/profile');
}
