'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireMember } from '@/lib/auth';

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
  const { supabase, profile } = await requireMember();
  const username = formData.get('username');
  const displayName = formData.get('display_name');
  if (typeof username !== 'string' || !/^[a-z0-9_]{3,30}$/.test(username) || typeof displayName !== 'string' || !displayName.trim() || displayName.trim().length > 80) redirect('/profile?error=validation');
  const { error } = await supabase.from('profiles').update({ username, display_name: displayName.trim() }).eq('id', profile.id);
  if (error) redirect('/profile?error=save');
  redirect('/');
}

export async function acceptInvite(formData: FormData) {
  const email = formData.get('email');
  const token = formData.get('code');
  if (typeof email !== 'string' || !email.trim() || email.length > 254 || typeof token !== 'string' || !/^\d{6}$/.test(token)) redirect('/invite?error=invalid');
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'invite' });
  if (error) redirect('/invite?error=invalid');
  redirect('/set-password');
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
