'use client';

import { useActionState } from 'react';
import { createMember, type CreateMemberState } from './actions';

export function MemberForm() {
  const [state, action, pending] = useActionState(createMember, {} as CreateMemberState);
  return (
    <>
      <form action={action} className="form">
        <label htmlFor="member-email">Email del membro</label>
        <input id="member-email" name="email" type="email" inputMode="email" autoComplete="off" required maxLength={254} />
        <div className="btn-row"><button className="btn" disabled={pending}>{pending ? 'Creazione…' : 'Crea account'}</button></div>
      </form>
      {state.error && <div className="notice err" role="alert"><b>Non riuscito.</b><span>{state.error}</span></div>}
      {state.password && (
        <section aria-live="polite" className="form">
          <h3 className="lbl" style={{ marginTop: 14 }}>Account creato</h3>
          <p>Comunica queste credenziali personalmente. La password è mostrata solo ora e dovrà essere cambiata al primo accesso.</p>
          <p>Email: <strong>{state.email}</strong></p>
          <p>Password temporanea: <strong className="tnum">{state.password}</strong></p>
        </section>
      )}
    </>
  );
}
