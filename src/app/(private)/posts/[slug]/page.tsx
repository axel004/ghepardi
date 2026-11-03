import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireReadyMember } from '@/lib/auth';
import { emojis, pageNumber } from '@/lib/posts';
import { addComment, deleteComment, reactToPost } from '../actions';

export default async function PostPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string; page?: string }> }) {
  const { supabase, profile } = await requireReadyMember(), { slug } = await params;
  if (!/^[a-z0-9-]{1,180}$/.test(slug)) notFound();
  const { data: post, error } = await supabase.from('posts').select('id,title,content,category,status').eq('slug', slug).maybeSingle();
  if (error) throw new Error('Impossibile caricare il post');
  if (!post) notFound();
  const query = await searchParams, page = pageNumber(query.page);
  const [commentResult, reactionResult] = post.status === 'published' ? await Promise.all([
    supabase.from('comments').select('id,user_id,content,created_at,profiles(display_name,username)').eq('post_id', post.id).order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20),
    supabase.from('post_reactions').select('emoji,user_id').eq('post_id', post.id),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  const comments = commentResult.data ?? [], reactions = reactionResult.data ?? [];
  return <main className="panel"><p><Link href="/">← Home</Link></p><p className="eyebrow">{post.category}{post.status === 'draft' && ' · BOZZA'}</p><h1>{post.title}</h1><div className="post-content">{post.content}</div>
    {profile.role === 'admin' && <p><Link href={`/admin/posts/${post.id}`}>Modifica post</Link></p>}
    {post.status === 'published' && <><h2>Reazioni</h2>{reactionResult.error ? <p className="error">Impossibile caricare le reaction.</p> : <div className="reactions">{emojis.map((emoji) => {
      const selected = reactions.some((r) => r.emoji === emoji && r.user_id === profile.id), count = reactions.filter((r) => r.emoji === emoji).length;
      return <form key={emoji} action={reactToPost}><input type="hidden" name="post_id" value={post.id} /><input type="hidden" name="slug" value={slug} /><input type="hidden" name="emoji" value={emoji} /><input type="hidden" name="operation" value={selected ? 'remove' : 'add'} /><button className={selected ? 'reaction selected' : 'reaction'} aria-label={`${emoji}, ${count} reazioni${selected ? ', selezionata' : ''}`} aria-pressed={selected}>{emoji} {count}</button></form>;
    })}</div>}
    <h2>Commenti</h2>{query.error && <p className="error" role="alert">Operazione non riuscita. Riprova.</p>}
    <form action={addComment} className="form"><input type="hidden" name="post_id" value={post.id} /><input type="hidden" name="slug" value={slug} /><label htmlFor="comment">Scrivi un commento</label><textarea id="comment" name="content" maxLength={2000} rows={3} required /><button>Commenta</button></form>
    {commentResult.error ? <p className="error">Impossibile caricare i commenti.</p> : !comments.length ? <p>Ancora nessun commento.</p> : comments.slice(0, 20).map((comment) => {
      const author = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
      return <article className="comment" key={comment.id}><strong>{author?.display_name || author?.username || 'Membro'}</strong><p className="post-content">{comment.content}</p>{(comment.user_id === profile.id || profile.role === 'admin') && <form action={deleteComment}><input type="hidden" name="id" value={comment.id} /><input type="hidden" name="slug" value={slug} /><button className="text-button">Elimina commento</button></form>}</article>;
    })}
    <nav className="pagination" aria-label="Pagine dei commenti">{page > 1 && <Link href={`/posts/${slug}?page=${page - 1}`}>← Più recenti</Link>}{comments.length > 20 && <Link href={`/posts/${slug}?page=${page + 1}`}>Più vecchi →</Link>}</nav></>}
  </main>;
}
