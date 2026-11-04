/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireReadyMember } from '@/lib/auth';
import { emojis, isUuid, pageNumber } from '@/lib/posts';
import { addComment, deleteComment, reactToPost } from '../actions';
import { MentionText, mentionNames } from '../mentions';

export default async function PostPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string; page?: string; focus?: string }> }) {
  const { supabase, profile } = await requireReadyMember(), { slug } = await params;
  if (!/^[a-z0-9-]{1,180}$/.test(slug)) notFound();
  const { data: post, error } = await supabase.from('posts').select('id,title,content,category,status,cover_photo_id').eq('slug', slug).maybeSingle();
  if (error) throw new Error('Impossibile caricare il post');
  if (!post) notFound();
  const query = await searchParams, page = pageNumber(query.page);
  const [commentResult, reactionResult] = post.status === 'published' ? await Promise.all([
    supabase.from('comments').select('id,user_id,parent_id,content,created_at,profiles(display_name,username)').eq('post_id', post.id).order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20),
    supabase.from('post_reactions').select('emoji,user_id').eq('post_id', post.id),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  const comments = commentResult.data ?? [], reactions = reactionResult.data ?? [];
  const focused = post.status === 'published' && query.focus && isUuid(query.focus) && !comments.slice(0, 20).some(comment => comment.id === query.focus)
    ? await supabase.from('comments').select('id,user_id,parent_id,content,created_at,profiles(display_name,username)').eq('post_id', post.id).eq('id', query.focus).maybeSingle()
    : { data: null, error: null };
  const visibleComments = focused.data ? [focused.data, ...comments.slice(0, 20)] : comments.slice(0, 20);
  const parentIds = [...new Set(visibleComments.flatMap(comment => comment.parent_id ? [comment.parent_id] : []))];
  const names = [...new Set([post.title, post.content, ...visibleComments.map(comment => comment.content)].flatMap(mentionNames))];
  const [parentResult, namesResult] = await Promise.all([
    parentIds.length ? supabase.from('comments').select('id,profiles(display_name,username)').in('id', parentIds) : Promise.resolve({ data: [], error: null }),
    names.length ? supabase.from('profiles').select('username').in('username', names) : Promise.resolve({ data: [], error: null }),
  ]);
  const knownNames = new Set((namesResult.data ?? []).flatMap(person => person.username ? [person.username] : []));
  return <main className="panel"><p><Link href="/">← Home</Link></p><p className="eyebrow">{post.category}{post.status === 'draft' && ' · BOZZA'}</p><h1><MentionText text={post.title} names={knownNames} /></h1>{post.cover_photo_id && <img className="post-image" src={`/media/${post.cover_photo_id}`} alt={`Copertina: ${post.title}`} />}<div className="post-content"><MentionText text={post.content} names={knownNames} /></div>
    {profile.role === 'admin' && <p><Link href={`/admin/posts/${post.id}`}>Modifica post</Link></p>}
    {post.status === 'published' && <><h2>Reazioni</h2>{reactionResult.error ? <p className="error">Impossibile caricare le reaction.</p> : <div className="reactions">{emojis.map((emoji) => {
      const selected = reactions.some((r) => r.emoji === emoji && r.user_id === profile.id), count = reactions.filter((r) => r.emoji === emoji).length;
      return <form key={emoji} action={reactToPost}><input type="hidden" name="post_id" value={post.id} /><input type="hidden" name="slug" value={slug} /><input type="hidden" name="emoji" value={emoji} /><input type="hidden" name="operation" value={selected ? 'remove' : 'add'} /><button className={selected ? 'reaction selected' : 'reaction'} aria-label={`${emoji}, ${count} reazioni${selected ? ', selezionata' : ''}`} aria-pressed={selected}>{emoji} {count}</button></form>;
    })}</div>}
    <h2>Commenti</h2>{query.error && <p className="error" role="alert">Operazione non riuscita. Riprova.</p>}
    <form action={addComment} className="form"><input type="hidden" name="post_id" value={post.id} /><input type="hidden" name="slug" value={slug} /><label htmlFor="comment">Scrivi un commento</label><textarea id="comment" name="content" maxLength={2000} rows={3} required /><small>Per menzionare un amico scrivi @nome_utente.</small><button>Commenta</button></form>
    {commentResult.error || focused.error ? <p className="error">Impossibile caricare i commenti.</p> : !visibleComments.length ? <p>Ancora nessun commento.</p> : visibleComments.map((comment) => {
      const author = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
      const parent = parentResult.data?.find(item => item.id === comment.parent_id), parentAuthor = Array.isArray(parent?.profiles) ? parent.profiles[0] : parent?.profiles;
      return <article className="comment" id={`comment-${comment.id}`} key={comment.id}><strong>{author?.display_name || author?.username || 'Membro'}</strong>{comment.parent_id && <p><small>↳ In risposta a {parentAuthor?.display_name || parentAuthor?.username || 'un commento'}</small></p>}<p className="post-content"><MentionText text={comment.content} names={knownNames} /></p><details><summary>Rispondi</summary><form action={addComment} className="form"><input type="hidden" name="post_id" value={post.id} /><input type="hidden" name="slug" value={slug} /><input type="hidden" name="parent_id" value={comment.id} /><label htmlFor={`reply-${comment.id}`}>La tua risposta</label><textarea id={`reply-${comment.id}`} name="content" maxLength={2000} rows={2} required /><small>Puoi menzionare un amico con @nome_utente.</small><button>Invia risposta</button></form></details>{(comment.user_id === profile.id || profile.role === 'admin') && <form action={deleteComment}><input type="hidden" name="id" value={comment.id} /><input type="hidden" name="slug" value={slug} /><button className="text-button">Elimina commento</button></form>}</article>;
    })}
    <nav className="pagination" aria-label="Pagine dei commenti">{page > 1 && <Link href={`/posts/${slug}?page=${page - 1}`}>← Più recenti</Link>}{comments.length > 20 && <Link href={`/posts/${slug}?page=${page + 1}`}>Più vecchi →</Link>}</nav></>}
  </main>;
}
