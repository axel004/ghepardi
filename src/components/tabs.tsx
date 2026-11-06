'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icon } from './ui';

const tabs = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/posts', label: 'Post', icon: 'post' },
  { href: '/gallery', label: 'Gallery', icon: 'photo' },
  { href: '/members', label: 'Branco', icon: 'users' },
  { href: '/altro', label: 'Altro', icon: 'menu' },
] as const;

const main = ['/posts', '/gallery', '/members'];
const tabFor = (path: string) => (path === '/' ? '/' : main.find(p => path === p || path.startsWith(`${p}/`)) ?? '/altro');

export function Tabs() {
  const path = usePathname();
  const active = tabFor(path);
  // L'indicatore si sposta al tocco, senza aspettare il server; al cambio di pagina torna a seguire il percorso.
  const [tapped, setTapped] = useState<{ href: string; from: string } | null>(null);
  const shown = tapped && tapped.from === path ? tapped.href : active;
  const index = tabs.findIndex(t => t.href === shown);
  const from = tabs.findIndex(t => t.href === active);
  return (
    <nav className="tabs" aria-label="Navigazione principale">
      <i className="tab-ind" aria-hidden="true" style={{ transform: `translateX(${index * 100}%)` }} />
      {tabs.map((tab, i) => (
        <Link key={tab.href} href={tab.href} aria-current={shown === tab.href ? 'page' : undefined} onClick={() => setTapped({ href: tab.href, from: path })} transitionTypes={[i > from ? 'nav-forward' : 'nav-back']}>
          <Icon name={tab.icon} /><span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
