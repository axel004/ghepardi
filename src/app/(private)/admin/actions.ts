'use server';

import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth';

export type CreateMemberState = { error?: string; email?: string; password?: string };

export async function createMember(_previous: CreateMemberState, formData: FormData): Promise<CreateMemberState> {
  await requireAdmin();
  const email = formData.get('email');
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { error: 'Inserisci un indirizzo email valido.' };
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return { error: 'La creazione degli account non è configurata. Contatta chi gestisce il sito.' };
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const password = randomBytes(18).toString('base64url');
  const { error } = await admin.auth.admin.createUser({ email: email.trim(), password, email_confirm: true });
  if (error) return { error: 'Impossibile creare l’account. Verifica che l’email non sia già registrata.' };
  return { email: email.trim(), password };
}
