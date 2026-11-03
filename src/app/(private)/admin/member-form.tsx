'use client';

import { useActionState } from 'react';
import { createMember, type CreateMemberState } from './actions';

export function MemberForm() {
  const [state, action, pending] = useActionState(createMember, {} as CreateMemberState);
  return <>
    <form action={action} className="form"><label htmlFor="member-email">Email del membro</label><input id="member-email" name="email" type="email" autoComplete="off" required maxLength={254} /><button disabled={pending}>{pending ? 'Creazione…' : 'Crea account'}</button></form>
    {state.error && <p className="error" role="alert">{state.error}</p>}
    {state.password && <section aria-live="polite"><h2>Account creato</h2><p>Comunica queste credenziali personalmente. La password è mostrata solo ora e dovrà essere cambiata al primo accesso.</p><p>Email: <strong>{state.email}</strong></p><p>Password temporanea: <strong>{state.password}</strong></p></section>}
  </>;
}
