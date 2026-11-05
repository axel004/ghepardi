import Link from 'next/link';
import { ViewTransition } from 'react';
import type { ReactNode } from 'react';

const paths = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10M10 20v-5h4v5',
  post: 'M5 4h11v16H5zM16 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h3',
  photo: 'M3 5h18v14H3zM3 17l6-5 4 3 3-2 5 4M8 10.5h.01',
  users: 'M9 11a3 3 0 1 0 .01 0M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5a3 3 0 0 1 0 6M18 14c1.8.6 3 2.3 3 4.5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  bell: 'M6 17v-6a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4',
  back: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  plus: 'M12 5v14M5 12h14',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
} as const;

export function Icon({ name }: { name: keyof typeof paths }) {
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

/** Ogni pagina entra e esce con lo scorrimento direzionale delle View Transitions. */
export function Screen({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ViewTransition enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }} exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }} default="none">
      <main id="main" className="screen" aria-label={label}>{children}</main>
    </ViewTransition>
  );
}

export function Head({ title, tick, children }: { title: string; tick?: ReactNode; children?: ReactNode }) {
  return <header className="head"><h1><span>{title}</span>{tick && <span className="tick">{tick}</span>}</h1>{children && <p>{children}</p>}</header>;
}

export function Back({ href, children = 'Indietro' }: { href: string; children?: ReactNode }) {
  return <Link className="back" href={href} transitionTypes={['nav-back']}><Icon name="back" />{children}</Link>;
}

export function Mark({ state }: { state: 'done' | 'open' | 'void' }) {
  const label = state === 'done' ? 'fatto' : state === 'void' ? 'annullato' : 'da fare';
  return <span className={`mark ${state}`} role="img" aria-label={label} />;
}

export function Notice({ kind = 'ok', children }: { kind?: 'ok' | 'err'; children: ReactNode }) {
  return <div className={`notice ${kind === 'err' ? 'err' : ''}`} role={kind === 'err' ? 'alert' : 'status'}><b>{kind === 'err' ? 'Non riuscito.' : 'Fatto.'}</b><span>{children}</span></div>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty"><b>{title}</b>{children && <p>{children}</p>}</div>;
}

export function Pager({ prev, next, prevLabel = 'Più recenti', nextLabel = 'Più vecchi' }: { prev?: string; next?: string; prevLabel?: string; nextLabel?: string }) {
  if (!prev && !next) return null;
  return <nav className="pager" aria-label="Pagine">{prev ? <Link href={prev} transitionTypes={['nav-back']}>← {prevLabel}</Link> : <span />}{next ? <Link href={next} transitionTypes={['nav-forward']}>{nextLabel} →</Link> : <span />}</nav>;
}

/** Una riga d'orario: etichetta condensata, titolo, segno di stato. */
export function Row({ when, title, sub, href, mark, className = "", clamp = false }: { when?: ReactNode; title: ReactNode; sub?: ReactNode; href?: string; mark?: ReactNode; className?: string; clamp?: boolean }) {
  const inner = <>{when !== undefined && <span className="when">{when}</span>}<span className="what"><b>{title}</b>{sub && <small className={clamp ? "clamp" : undefined}>{sub}</small>}</span>{mark ?? (href ? <Icon name="next" /> : <span />)}</>;
  const cls = `row ${when === undefined ? 'solo' : ''} ${className}`;
  return href ? <Link href={href} className={cls} transitionTypes={['nav-forward']}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

export function Slide({ children, title, tone = 'dark', shape = 'a' }: { children: ReactNode; title?: string; tone?: 'dark' | 'light'; shape?: 'a' | 'b' | 'c' }) {
  return <section className={`slide ${shape} ${tone === 'light' ? 'light' : ''}`} aria-label={title}>{title && <h2>{title}</h2>}{children}</section>;
}

export function SectionHead({ title, href, link }: { title: string; href?: string; link?: string }) {
  return <div className="sec-h"><h2>{title}</h2>{href && <Link href={href} transitionTypes={['nav-forward']}>{link ?? 'Tutti'} →</Link>}</div>;
}

export const dateIt = (iso: string) => iso.split('-').reverse().join('/');
export const dayMonth = (iso: string) => new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)).replace('.', '');
export const stamp = (iso: string) => new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }).format(new Date(iso)).replace('.', '');
