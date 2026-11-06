/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
import { ViewTransition } from 'react';
import { requireReadyMember } from '@/lib/auth';
import { pageNumber } from '@/lib/posts';
import { Empty, Head, Pager, Row, Screen, Slide, ago } from '@/components/ui';

export const metadata = { title: 'Post' };
const category: Record<string, string> = { news: 'News', stories: 'Storia', cronache: 'Cronaca', viaggi: 'Viaggio', serate: 'Serata', meme: 'Meme', speciali: 'Speciale' };

export default async function Posts({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { supabase, profile } = await requireReadyMember();
  const page = pageNumber((await searchParams).page);
  const { data: posts, error } = await supabase.from('posts').select('id,title,slug,content,category,cover_photo_id,published_at').eq('status', 'published').order('published_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20);
  const shown = posts?.slice(0, 20) ?? [];
  const lead = page === 1 ? shown.find(post => post.cover_photo_id) : undefined;
  return (
    <Screen>
      <Head title="Post" tick={page > 1 ? `Pag. ${page}` : undefined}>Cronache, meme e momenti da ricordare.</Head>
      {profile.role === 'admin' && <p className="pager"><Link href="/admin/posts/new" className="btn ghost" transitionTypes={['nav-forward']}>Scrivi un post</Link></p>}
      {lead && <Link href={`/posts/${lead.slug}`} className="lead" style={{ marginBottom: 0 }} transitionTypes={['nav-forward']} aria-hidden="true" tabIndex={-1}><ViewTransition name={`cover-${lead.slug}`}><img src={`/media/${lead.cover_photo_id}?size=thumb`} alt="" /></ViewTransition></Link>}
      {error ? <Empty title="Non si carica">Impossibile caricare i post. Riprova.</Empty>
        : !shown.length ? <Empty title="Ancora nessun post">Il primo ricordo aspetta solo voi.</Empty>
        : <Slide shape="a">{shown.map(post => (
          <Row key={post.id} href={`/posts/${post.slug}`} when={ago(post.published_at)} title={post.title} sub={`${category[post.category] ?? post.category} · ${post.content.slice(0, 160)}`} clamp />
        ))}</Slide>}
      <Pager prev={page > 1 ? `/posts?page=${page - 1}` : undefined} next={posts && posts.length > 20 ? `/posts?page=${page + 1}` : undefined} />
    </Screen>
  );
}
