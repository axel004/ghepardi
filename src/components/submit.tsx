'use client';
import { useFormStatus } from 'react-dom';
import type { ReactNode } from 'react';

/** Bottone d'invio: dice subito che ha sentito il tocco e non si può premere due volte. */
export function Submit({ children, pending = 'Un attimo…', className = 'btn' }: { children: ReactNode; pending?: string; className?: string }) {
  const status = useFormStatus();
  return <button className={className} disabled={status.pending} aria-busy={status.pending}>{status.pending ? pending : children}</button>;
}
