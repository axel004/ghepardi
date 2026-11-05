'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

const THRESHOLD = 76;
const MAX = 120;

/** Trascina verso il basso dalla cima: la pagina segue il dito (solo transform) e a soglia si aggiorna. */
export function PullRefresh() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState<'idle' | 'pull' | 'ready'>('idle');
  const label = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  useEffect(() => { busy.current = pending; }, [pending]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const target = () => document.querySelector<HTMLElement>('.screen');
    let startY = 0, dist = 0, tracking = false, raf = 0;

    const apply = (d: number, animate: boolean) => {
      const el = target();
      if (!el) return;
      el.style.transition = animate && !reduce.matches ? 'transform 380ms cubic-bezier(.16,1,.3,1)' : 'none';
      el.style.transform = d ? `translate3d(0, ${reduce.matches ? 0 : d}px, 0)` : '';
      if (label.current) {
        label.current.style.transition = animate && !reduce.matches ? 'transform 380ms cubic-bezier(.16,1,.3,1), opacity 200ms' : 'none';
        label.current.style.opacity = String(Math.min(1, d / THRESHOLD));
        label.current.style.transform = `translate3d(0, ${Math.min(d, MAX) - 56}px, 0)`;
      }
    };
    const onStart = (e: TouchEvent) => {
      if (busy.current || window.scrollY > 0 || e.touches.length !== 1) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('input,textarea,select,details[open]')) return;
      startY = e.touches[0].clientY; tracking = true; dist = 0;
    };
    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0 || window.scrollY > 0) { if (dist) { dist = 0; apply(0, true); setState('idle'); } return; }
      if (e.cancelable) e.preventDefault();
      dist = Math.min(MAX, dy * 0.5); // resistenza
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => apply(dist, false));
      setState(dist >= THRESHOLD ? 'ready' : 'pull');
    };
    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      cancelAnimationFrame(raf);
      if (dist >= THRESHOLD) {
        apply(THRESHOLD * 0.7, true);
        start(() => router.refresh());
      } else apply(0, true);
      dist = 0;
      setState('idle');
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [router]);

  useEffect(() => {
    if (!pending) {
      const el = document.querySelector<HTMLElement>('.screen');
      if (el && el.style.transform) { el.style.transition = 'transform 380ms cubic-bezier(.16,1,.3,1)'; el.style.transform = ''; }
      if (label.current) { label.current.style.opacity = '0'; label.current.style.transform = 'translate3d(0,-56px,0)'; }
    }
  }, [pending]);

  return (
    <div ref={label} className="pull" aria-live="polite" style={{ opacity: 0, transform: 'translate3d(0,-56px,0)' }}>
      <span className="lbl">{pending ? 'Aggiorno…' : state === 'ready' ? 'Rilascia per aggiornare' : 'Tira per aggiornare'}</span>
    </div>
  );
}
