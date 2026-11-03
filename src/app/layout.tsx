import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Ghepardi', description: 'Private members club', robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="it"><body>{children}</body></html>; }
