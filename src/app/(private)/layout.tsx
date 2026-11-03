import { requireMember } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  await requireMember();
  return children;
}
