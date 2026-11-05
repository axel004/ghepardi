/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireReadyMember } from '@/lib/auth';
import { Mark, Row, Screen, SectionHead, Slide, dayMonth } from '@/components/ui';

const romeToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const daysTo = (iso: string, from: string) => Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
const category: Record<string, string> = { news: 'News', stories: 'Storia', cronache: 'Cronaca', viaggi: 'Viaggio', serate: 'Serata', meme: 'Meme', speciali: 'Speciale' };

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { profile, supabase } = await requireReadyMember();
  if (!profile.username || !profile.display_name) redirect('/profile');
  const { page } = await searchParams;
  if (page && /^\d{1,6}$/.test(page)) redirect(`/posts?page=${page}`);
  const today = romeToday();
  const [posts, albums, events, polls, mine, quotes] = await Promise.all([
    supabase.from('posts').select('id,title,slug,content,category,cover_photo_id').eq('status', 'published').order('published_at', { ascending: false }).order('id', { ascending: false }).limit(3),
    supabase.from('albums').select('id,title,event_date,photos(id,created_at)').order('created_at', { ascending: false }).order('created_at', { referencedTable: 'photos', ascending: false }).limit(1, { referencedTable: 'photos' }).limit(3),
    supabase.from('events').select('id,title,event_date,event_time,location').gte('event_date', today).order('event_date', { ascending: true }).order('event_time', { ascending: true, nullsFirst: true }).limit(2),
    supabase.from('polls').select('id,question,closes_on,closed').eq('closed', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('poll_votes').select('poll_id').eq('user_id', profile.id),
    supabase.from('quotes').select('id,content,speaker').order('created_at', { ascending: false }).limit(1),
  ]);
  const voted = new Set((mine.data ?? []).map(v => v.poll_id));
  const open = (polls.data ?? []).filter(p => !(p.closes_on && p.closes_on < today));
  const toVote = open.filter(p => !voted.has(p.id));
  const next = events.data?.[0];
  const quote = quotes.data?.[0];
  const dateline = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Rome' }).format(new Date());
  const left = next ? daysTo(next.event_date, today) : 0;
  return (
    <Screen>
      <p className="dateline">{dateline}</p>
      <div style={{ height: 14 }} />
      <Slide title="Le ultime dal branco" shape="a">
        {posts.error ? <p className="foot">Impossibile caricare i post. Riprova più tardi.</p>
          : !posts.data?.length ? <p className="foot">Qui inizia la storia. Il primo post aspetta solo voi.</p>
          : posts.data.map(post => <Row key={post.id} when={category[post.category] ?? post.category} title={post.title} sub={post.content.slice(0, 160)} clamp href={`/posts/${post.slug}`} />)}
        <p className="foot"><Link href="/posts">Tutti i post →</Link></p>
      </Slide>
      {next && (
        <Link href="/events" className="plate" transitionTypes={['nav-forward']}>
          <span className="lbl">Prossimo evento · {left === 0 ? 'oggi' : left === 1 ? 'domani' : `tra ${left} giorni`}</span>
          <strong>{next.title}</strong>
          <span>{dayMonth(next.event_date)}{next.event_time ? ` · ${next.event_time.slice(0, 5)}` : ''}{next.location ? ` · ${next.location}` : ''}</span>
        </Link>
      )}
      <Slide title="Il tuo voto" shape="b" tone="light">
        {polls.error || mine.error ? <p className="foot">Impossibile caricare i sondaggi.</p>
          : toVote.length ? toVote.slice(0, 3).map(p => <Row key={p.id} when="Da votare" title={p.question} sub={p.closes_on ? `Chiude il ${dayMonth(p.closes_on)}` : 'Votazione aperta'} href="/polls" mark={<Mark state="open" />} />)
          : open.length ? open.slice(0, 2).map(p => <Row key={p.id} when="Votato" title={p.question} sub="Il tuo voto è segreto" href="/polls" mark={<Mark state="done" />} />)
          : <p className="foot">Nessun sondaggio aperto. Si accettano domande scomode.</p>}
      </Slide>
      {quote && (
        <section className="pane" aria-label="Citazione">
          <p className="meta">Fuori contesto</p>
          <blockquote className="prose">“{quote.content}”</blockquote>
          <p><b>— {quote.speaker}</b></p>
        </section>
      )}
      <SectionHead title="Foto recenti" href="/gallery" link="Gallery" />
      <Slide shape="c">
        {albums.error ? <p className="foot">Impossibile caricare gli album.</p>
          : !albums.data?.length ? <p className="foot">La gallery è pronta. Le foto migliori sono ancora da caricare.</p>
          : albums.data.map(album => (
            <Row key={album.id} href={`/gallery/${album.id}`} title={album.title} sub={album.event_date ? dayMonth(album.event_date) : undefined}
              when={album.photos?.[0] ? <img src={`/media/${album.photos[0].id}?size=thumb`} alt="" width={64} height={48} loading="lazy" style={{ width: 64, height: 48, objectFit: 'cover' }} /> : 'Foto'} />
          ))}
      </Slide>
      {profile.role === 'admin' && <Slide shape="a" tone="light"><Row when="Admin" title="Hai qualcosa da raccontare?" sub="Post, album e membri" href="/admin" /></Slide>}
    </Screen>
  );
}
