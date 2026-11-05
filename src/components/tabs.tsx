'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './ui';

const tabs = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/posts', label: 'Post', icon: 'post' },
  { href: '/gallery', label: 'Foto', icon: 'photo' },
  { href: '/members', label: 'Branco', icon: 'users' },
  { href: '/altro', label: 'Altro', icon: 'menu' },
] as const;

const main = ['/posts', '/gallery', '/members'];

export function Tabs() {
  const path = usePathname();
  const active = path === '/' ? '/' : main.find(p => path === p || path.startsWith(`${p}/`)) ?? '/altro';
  return (
    <nav className="tabs" aria-label="Navigazione principale">
      {tabs.map(tab => (
        <Link key={tab.href} href={tab.href} aria-current={active === tab.href ? 'page' : undefined} transitionTypes={[tabs.findIndex(t => t.href === tab.href) > tabs.findIndex(t => t.href === active) ? 'nav-forward' : 'nav-back']}>
          <Icon name={tab.icon} /><span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
