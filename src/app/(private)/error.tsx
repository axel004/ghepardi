'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="screen" id="main">
      <header className="head"><h1><span>Qualcosa si è inceppato</span></h1><p>Non è colpa tua. Riprova, e se persiste scrivi all’admin.</p></header>
      <div className="btn-row" style={{ padding: '0 var(--gut)' }}><button className="btn" onClick={reset}>Riprova</button></div>
    </main>
  );
}
