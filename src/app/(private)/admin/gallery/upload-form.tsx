'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Formato non supportato dal dispositivo.')); };
    image.src = url;
  });
}
async function compress(file: File): Promise<Blob> {
  if (file.size > 30000000) throw new Error('La foto supera 30 MB.');
  const image = await loadImage(file), scale = Math.min(1, 1920 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Impossibile preparare la foto.');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.78));
  if (!blob || blob.size > 2500000) throw new Error('Impossibile ridurre la foto.');
  return blob;
}

export function UploadForm({ albumId }: { albumId: string }) {
  const [status, setStatus] = useState(''), [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null), router = useRouter();
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const files = Array.from(input.current?.files ?? []);
    if (!files.length) { setStatus('Scegli almeno una foto.'); return; }
    setBusy(true);
    let done = 0;
    const failed: string[] = [];
    for (const [index, file] of files.entries()) {
      setStatus(`Caricamento ${index + 1} di ${files.length}…`);
      try {
        const image = await compress(file), data = new FormData();
        data.set('album_id', albumId); data.set('photo', image, 'foto.jpg');
        const result = await fetch('/api/gallery/upload', { method: 'POST', body: data, redirect: 'error' });
        if (!result.ok || !(await result.json()).ok) throw new Error('Caricamento non riuscito.');
        done++;
      } catch { failed.push(file.name); }
    }
    setStatus(failed.length ? `Caricate ${done} foto. Non caricate: ${failed.join(', ')}. Riprova o scegli un formato supportato.` : `Caricate ${done} foto!`);
    if (input.current) input.current.value = '';
    setBusy(false); router.refresh();
  }
  return <form onSubmit={upload} className="form"><label htmlFor="photos">Scegli le foto</label><input ref={input} id="photos" type="file" accept="image/*" multiple required disabled={busy} /><small>Puoi sceglierne più di una, fino a 30 MB ciascuna. Saranno salvate in JPEG, con lato massimo di 1920 pixel.</small><div className="btn-row"><button className="btn" disabled={busy}>{busy ? "Caricamento…" : "Carica foto"}</button></div>{status && <p role="status">{status}</p>}</form>;
}
