/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import Link from 'next/link';
import { requireReadyMember } from '@/lib/auth';
import { pageNumber } from '@/lib/posts';
import { Empty, Head, Pager, Row, Screen, Slide } from '@/components/ui';

export const metadata = { title: 'Post' };
const category: Record<string, string> = { news: 'News', stories: 'Storia', cronache: 'Cronaca', viaggi: 'Viaggio', serate: 'Serata', meme: 'Meme', speciali: 'Speciale' };

export default async function Posts({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { supabase, profile } = await requireReadyMember();
  const page = pageNumber((await searchParams).page);
  const { data: posts, error } = await supabase.from('posts').select('id,title,slug,content,category,cover_photo_id').eq('status', 'published').order('published_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20);
  const shown = posts?.slice(0, 20) ?? [];
  return (
    <Screen>
      <Head title="Post" tick={`Pag. ${page}`}>Cronache, meme e momenti da ricordare.</Head>
      {profile.role === 'admin' && <p className="pager"><Link href="/admin/posts/new" className="btn" transitionTypes={['nav-forward']}>Scrivi un post</Link></p>}
      {error ? <Empty title="Non si carica">Impossibile caricare i post. Riprova.</Empty>
        : !shown.length ? <Empty title="Ancora nessun post">Il primo ricordo aspetta solo voi.</Empty>
        : <Slide shape="a">{shown.map(post => (
          <Row key={post.id} href={`/posts/${post.slug}`} title={post.title} sub={post.content.slice(0, 160)} clamp
            when={post.cover_photo_id ? <img src={`/media/${post.cover_photo_id}?size=thumb`} alt="" width={64} height={48} loading="lazy" style={{ width: 64, height: 48, objectFit: 'cover' }} /> : category[post.category] ?? post.category} />
        ))}</Slide>}
      <Pager prev={page > 1 ? `/posts?page=${page - 1}` : undefined} next={posts && posts.length > 20 ? `/posts?page=${page + 1}` : undefined} />
    </Screen>
  );
}
