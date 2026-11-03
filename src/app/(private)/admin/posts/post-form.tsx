import { categories } from '@/lib/posts';
import { savePost } from '../../posts/actions';

type Post = { id: string; title: string; content: string; category: string; status: string };
export function PostForm({ post }: { post?: Post }) {
  return <form action={savePost} className="form">{post && <input type="hidden" name="id" value={post.id} />}<label htmlFor="title">Titolo</label><input id="title" name="title" required maxLength={160} defaultValue={post?.title} />
    <label htmlFor="content">Testo</label><textarea id="content" name="content" required maxLength={50000} rows={10} defaultValue={post?.content} />
    <label htmlFor="category">Categoria</label><select id="category" name="category" defaultValue={post?.category ?? 'news'}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
    <button name="status" value="published">Pubblica</button><button name="status" value="draft" className="secondary">Salva come bozza</button></form>;
}
