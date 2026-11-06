import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { demo } from '@/lib/demo';

const AWAY = 30 * 60 * 1000;
const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 } as const;

/** Su Home: "gh_seen" è il confine del nuovo; si sposta solo se si torna dopo 30 minuti. "gh_arrive" vale per quella sola richiesta. */
function stampVisit(request: NextRequest) {
  const prefetch = request.headers.get('next-router-prefetch') || request.headers.get('purpose') === 'prefetch' || request.headers.get('sec-purpose')?.includes('prefetch');
  if (request.nextUrl.pathname !== '/' || request.method !== 'GET' || prefetch) return null;
  const now = Date.now(), last = Number(request.cookies.get('gh_last')?.value) || 0, seen = Number(request.cookies.get('gh_seen')?.value) || 0;
  const back = now - last > AWAY;
  const boundary = back ? last || now : seen || last || now;
  request.cookies.set('gh_seen', String(boundary));
  if (back && last) request.cookies.set('gh_arrive', '1'); else request.cookies.delete('gh_arrive');
  return { now, boundary };
}

export async function proxy(request: NextRequest) {
  const visit = stampVisit(request);
  const response = await session(request);
  if (visit) {
    response.cookies.set('gh_last', String(visit.now), cookieOptions);
    response.cookies.set('gh_seen', String(visit.boundary), cookieOptions);
  }
  return response;
}

async function session(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (demo) return response;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: (items) => {
      items.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    },
  } });
  const { data } = await supabase.auth.getClaims();
  // Solo in sviluppo locale (`next dev`): accesso automatico con un utente di prova.
  // NODE_ENV è 'production' su Vercel, quindi questo ramo non può attivarsi lì.
  const devEmail = process.env.NODE_ENV === 'development' ? process.env.DEV_AUTO_LOGIN_EMAIL : undefined;
  const devPassword = process.env.NODE_ENV === 'development' ? process.env.DEV_AUTO_LOGIN_PASSWORD : undefined;
  if (!data?.claims?.sub && devEmail && devPassword) await supabase.auth.signInWithPassword({ email: devEmail, password: devPassword });
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
