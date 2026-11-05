import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { demo } from '@/lib/demo';

export async function proxy(request: NextRequest) {
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
