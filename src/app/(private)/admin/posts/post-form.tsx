/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
import { categories } from '@/lib/posts';
import { requireAdmin } from '@/lib/auth';
import { savePost } from '../../posts/actions';

type Post = { id: string; title: string; content: string; category: string; status: string; cover_photo_id: string | null };
export async function PostForm({ post }: { post?: Post }) {
  const { supabase } = await requireAdmin();
  // shortcut: show the latest 50 photos, add a searchable picker if the gallery grows.
  const result = await supabase.from('photos').select('id').order('created_at', { ascending: false }).order('id', { ascending: false }).limit(50);
  if (result.error) throw new Error('Impossibile caricare le foto');
  const photos = result.data ?? [];
  if (post?.cover_photo_id && !photos.some((photo) => photo.id === post.cover_photo_id)) photos.unshift({ id: post.cover_photo_id });
  return <form action={savePost} className="form">{post && <input type="hidden" name="id" value={post.id} />}<label htmlFor="title">Titolo</label><input id="title" name="title" required maxLength={160} defaultValue={post?.title} />
    <label htmlFor="content">Testo</label><textarea id="content" name="content" required maxLength={50000} rows={10} defaultValue={post?.content} />
    <label htmlFor="category">Categoria</label><select id="category" name="category" defaultValue={post?.category ?? 'news'}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
    <fieldset><legend>Foto di copertina</legend><p><small>Scegli tra le 50 foto più recenti della <Link href="/admin/gallery">gallery</Link>.</small></p><label><input type="radio" name="cover_photo_id" value="" defaultChecked={!post?.cover_photo_id} /> Nessuna foto</label><div className="photo-grid">{photos.map((photo, index) => <label className="cover-choice" key={photo.id}><img src={`/media/${photo.id}?size=thumb`} alt={`Foto ${index + 1}`} loading="lazy" /><input type="radio" name="cover_photo_id" value={photo.id} defaultChecked={photo.id === post?.cover_photo_id} /> Usa questa</label>)}</div></fieldset>
    <button name="status" value="published">Pubblica</button><button name="status" value="draft" className="secondary">Salva come bozza</button></form>;
}
