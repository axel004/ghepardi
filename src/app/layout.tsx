import type { Metadata, Viewport } from 'next';
import { Barlow_Condensed, Libre_Franklin } from 'next/font/google';
import './globals.css';

const text = Libre_Franklin({ subsets: ['latin'], variable: '--font-text', display: 'swap', weight: ['400', '600', '700', '800'] });
const label = Barlow_Condensed({ subsets: ['latin'], variable: '--font-label', display: 'swap', weight: ['500', '600', '700', '800'] });

export const metadata: Metadata = { title: { default: 'Ghepardi', template: '%s · Ghepardi' }, description: 'Il club privato del branco.', robots: { index: false, follow: false } };
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#d9a21b' }, { media: '(prefers-color-scheme: dark)', color: '#14120c' }],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it" className={`${text.variable} ${label.variable}`}><body>{children}</body></html>;
}
