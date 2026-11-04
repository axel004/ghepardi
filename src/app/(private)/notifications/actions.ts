'use server';
import { redirect } from 'next/navigation';
import { requireReadyMember } from '@/lib/auth';

export async function markNotificationsRead() {
  const { supabase, profile } = await requireReadyMember();
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('recipient_id', profile.id).is('read_at', null);
  if (error) redirect('/notifications?error=save');
  redirect('/notifications');
}
