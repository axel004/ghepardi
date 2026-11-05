/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireReadyMember } from '@/lib/auth';
import { emojis, isUuid, pageNumber, reactionMeta } from '@/lib/posts';
import { addComment, deleteComment, reactToPost } from '../actions';
import { MentionText, mentionNames } from '../mentions';
import { Back, Empty, Icon, Notice, Pager, Screen, Slide, stamp } from '@/components/ui';

const category: Record<string, string> = { news: 'News', stories: 'Storia', cronache: 'Cronaca', viaggi: 'Viaggio', serate: 'Serata', meme: 'Meme', speciali: 'Speciale' };

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
  return (
    <Screen>
      <Back href="/posts">Post</Back>
      <header className="plate title">
        <span className="lbl">{category[post.category] ?? post.category}{post.status === 'draft' ? ' · Bozza' : ''}</span>
        <h1><MentionText text={post.title} names={knownNames} /></h1>
      </header>
      {post.cover_photo_id && <img className="hero-img" src={`/media/${post.cover_photo_id}`} alt={`Copertina: ${post.title}`} />}
      <article className="pane"><div className="prose"><MentionText text={post.content} names={knownNames} /></div></article>
      {profile.role === 'admin' && <p className="pager"><Link href={`/admin/posts/${post.id}`} className="btn ghost">Modifica post</Link></p>}
      {post.status === 'published' && (
        <>
          <Slide title="Reazioni" shape="b">
            {reactionResult.error ? <p className="foot">Impossibile caricare le reazioni.</p> : (
              <div className="chips" style={{ padding: '6px 0 8px' }}>
                {emojis.map(emoji => {
                  const selected = reactions.some(r => r.emoji === emoji && r.user_id === profile.id), count = reactions.filter(r => r.emoji === emoji).length;
                  return (
                    <form key={emoji} action={reactToPost}>
                      <input type="hidden" name="post_id" value={post.id} /><input type="hidden" name="slug" value={slug} /><input type="hidden" name="emoji" value={emoji} /><input type="hidden" name="operation" value={selected ? 'remove' : 'add'} />
                      <button className="chip" aria-label={`${reactionMeta[emoji].label}, ${count} ${count === 1 ? 'reazione' : 'reazioni'}${selected ? ', la tua' : ''}`} aria-pressed={selected}>{reactionMeta[emoji].icon === 'mark' ? <span className="mask chip-mark" aria-hidden="true" /> : <Icon name={reactionMeta[emoji].icon} />}<span className="tnum">{count}</span></button>
                    </form>
                  );
                })}
              </div>
            )}
          </Slide>
          <div className="sec-h"><h2>Commenti</h2></div>
          {query.error && <Notice kind="err">Operazione non riuscita. Riprova.</Notice>}
          <Slide shape="a" tone="light">
            <form action={addComment} className="form">
              <input type="hidden" name="post_id" value={post.id} /><input type="hidden" name="slug" value={slug} />
              <label htmlFor="comment">Scrivi un commento</label>
              <textarea id="comment" name="content" maxLength={2000} rows={3} required />
              <small>Per menzionare un amico scrivi @nome_utente.</small>
              <div className="btn-row"><button className="btn">Commenta</button></div>
            </form>
          </Slide>
          {commentResult.error || focused.error ? <Empty title="Non si carica">Impossibile caricare i commenti.</Empty>
            : !visibleComments.length ? <Empty title="Ancora nessun commento">Rompi il ghiaccio.</Empty>
            : visibleComments.map(comment => {
              const author = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
              const parent = parentResult.data?.find(item => item.id === comment.parent_id), parentAuthor = Array.isArray(parent?.profiles) ? parent.profiles[0] : parent?.profiles;
              return (
                <article className="pane" id={`comment-${comment.id}`} key={comment.id}>
                  <p className="meta">{author?.display_name || author?.username || 'Membro'} · {stamp(comment.created_at)}</p>
                  {comment.parent_id && <p className="meta">↳ In risposta a {parentAuthor?.display_name || parentAuthor?.username || 'un commento'}</p>}
                  <p className="prose"><MentionText text={comment.content} names={knownNames} /></p>
                  <details>
                    <summary>Rispondi</summary>
                    <form action={addComment} className="form">
                      <input type="hidden" name="post_id" value={post.id} /><input type="hidden" name="slug" value={slug} /><input type="hidden" name="parent_id" value={comment.id} />
                      <label htmlFor={`reply-${comment.id}`}>La tua risposta</label>
                      <textarea id={`reply-${comment.id}`} name="content" maxLength={2000} rows={2} required />
                      <div className="btn-row"><button className="btn">Invia risposta</button></div>
                    </form>
                  </details>
                  {(comment.user_id === profile.id || profile.role === 'admin') && (
                    <form action={deleteComment}><input type="hidden" name="id" value={comment.id} /><input type="hidden" name="slug" value={slug} /><button className="text-btn">Elimina commento</button></form>
                  )}
                </article>
              );
            })}
          <Pager prev={page > 1 ? `/posts/${slug}?page=${page - 1}` : undefined} next={comments.length > 20 ? `/posts/${slug}?page=${page + 1}` : undefined} />
        </>
      )}
    </Screen>
  );
}
