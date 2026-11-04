import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { requireAdmin } from '@/lib/auth';
import { isUuid } from '@/lib/posts';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  try {
    if (!origin || !['http:', 'https:'].includes(new URL(origin).protocol) || new URL(origin).host !== request.headers.get('host')) return Response.json({ error: 'Richiesta non valida.' }, { status: 403 });
  } catch { return Response.json({ error: 'Richiesta non valida.' }, { status: 403 }); }
  const { supabase, profile } = await requireAdmin();
  const form = await request.formData();
  const albumId = form.get('album_id'), file = form.get('photo');
  if (typeof albumId !== 'string' || !isUuid(albumId) || !(file instanceof File) || file.size === 0 || file.size > 2500000 || file.type !== 'image/jpeg') return Response.json({ error: 'Foto non valida o troppo grande.' }, { status: 400 });
  const { data: album, error: albumError } = await supabase.from('albums').select('id').eq('id', albumId).maybeSingle();
  if (albumError || !album) return Response.json({ error: 'Album non trovato.' }, { status: 404 });
  let image: Buffer;
  try {
    image = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 20000000, failOn: 'error' }).rotate().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
    if (image.length > 3000000) throw new Error('large');
  } catch { return Response.json({ error: 'Impossibile leggere questa immagine.' }, { status: 400 }); }
  const id = randomUUID(), path = `${albumId}/${id}.jpg`;
  const uploaded = await supabase.storage.from('ghepardi-gallery').upload(path, image, { contentType: 'image/jpeg', upsert: false, cacheControl: '0' });
  if (uploaded.error) return Response.json({ error: 'Caricamento non riuscito. Riprova.' }, { status: 500 });
  const created = await supabase.from('photos').insert({ id, album_id: albumId, storage_path: path, created_by: profile.id });
  if (created.error) {
    const cleanup = await supabase.storage.from('ghepardi-gallery').remove([path]);
    if (cleanup.error) console.error('Gallery: failed to clean up an incomplete upload.');
    return Response.json({ error: 'Salvataggio non riuscito. Riprova.' }, { status: 500 });
  }
  return Response.json({ ok: true });
}
