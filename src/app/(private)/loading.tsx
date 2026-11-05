export default function Loading() {
  return (
    <main className="screen" aria-busy="true" aria-label="Caricamento">
      <div style={{ height: 76 }} />
      <div className="skel" style={{ height: 120 }} /><div className="skel" /><div className="skel" />
    </main>
  );
}
