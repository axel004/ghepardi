import { requireReadyMember } from '@/lib/auth';
import { isUuid } from '@/lib/posts';
import { demo } from '@/lib/demo';
import sharp from 'sharp';

const tones = ['#3a3d38', '#5a4a2a', '#2c3a40', '#4a3326', '#34402f', '#46403a'];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return new Response(null, { status: 404 });
  const { supabase } = await requireReadyMember();
  const size = new URL(request.url).searchParams.get('size');
  const thumb = size === 'thumb', lead = size === 'lead';
  if (demo) {
    // Immagine sintetica di prova: solo in modalità demo, mai con dati reali.
    const n = Number(id.slice(-3)), w = 1200, h = n % 3 === 0 ? 1500 : n % 3 === 1 ? 900 : 1200;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${tones[n % tones.length]}"/><path d="M0 ${h * 0.72}L${w * 0.35} ${h * 0.5}L${w * 0.6} ${h * 0.66}L${w} ${h * 0.4}V${h}H0Z" fill="#00000040"/><text x="40" y="${h - 40}" font-family="sans-serif" font-size="40" fill="#f4f0e6">Foto di prova</text></svg>`;
    const buf = await sharp(Buffer.from(svg)).resize(thumb ? { width: 600 } : { width: 1200 }).jpeg({ quality: 70 }).toBuffer();
    return new Response(new Uint8Array(buf), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' } });
  }
  const { data: photo, error } = await supabase.from('photos').select('storage_path').eq('id', id).maybeSingle();
  if (error || !photo) return new Response(null, { status: 404 });
  const image = await supabase.storage.from('ghepardi-gallery').download(photo.storage_path);
  if (image.error || !image.data) return new Response(null, { status: 404 });
  const bytes = await image.data.arrayBuffer();
  const box = thumb ? 600 : lead ? 1200 : 0;
  const data = box ? await sharp(Buffer.from(bytes)).resize({ width: box, height: box, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: box === 600 ? 75 : 78 }).toBuffer() : bytes;
  return new Response(data, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
