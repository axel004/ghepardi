import { requireReadyMember } from '@/lib/auth';
import { isUuid } from '@/lib/posts';
import sharp from 'sharp';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return new Response(null, { status: 404 });
  const { supabase } = await requireReadyMember();
  const { data: photo, error } = await supabase.from('photos').select('storage_path').eq('id', id).maybeSingle();
  if (error || !photo) return new Response(null, { status: 404 });
  const image = await supabase.storage.from('ghepardi-gallery').download(photo.storage_path);
  if (image.error || !image.data) return new Response(null, { status: 404 });
  const bytes = await image.data.arrayBuffer();
  const data = new URL(request.url).searchParams.get('size') === 'thumb' ? await sharp(Buffer.from(bytes)).resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 75 }).toBuffer() : bytes;
  return new Response(data, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
