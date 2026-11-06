/* eslint-disable @next/next/no-img-element -- private images must not enter the shared image cache. */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ViewTransition } from 'react';
import { cookies } from 'next/headers';
import { requireReadyMember } from '@/lib/auth';
import { Icon, Row, Screen, SectionHead, Slide, Tag, ago, dayMonth } from '@/components/ui';

const romeToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const daysTo = (iso: string, from: string) => Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { profile, supabase } = await requireReadyMember();
  if (!profile.username || !profile.display_name) redirect('/profile');
  const { page } = await searchParams;
  if (page && /^\d{1,6}$/.test(page)) redirect(`/posts?page=${page}`);
  const today = romeToday();
  const store = await cookies();
  const since = Number(store.get('gh_seen')?.value) || 0, arrive = store.get('gh_arrive')?.value === '1';
  const [posts, albums, events, polls, mine, quotes] = await Promise.all([
    supabase.from('posts').select('id,title,slug,content,category,cover_photo_id,published_at').eq('status', 'published').order('published_at', { ascending: false }).order('id', { ascending: false }).limit(4),
    supabase.from('albums').select('id,title,event_date,photos(id,created_at)').order('created_at', { ascending: false }).order('created_at', { referencedTable: 'photos', ascending: false }).limit(1, { referencedTable: 'photos' }).limit(4),
    supabase.from('events').select('id,title,event_date,event_time,location').gte('event_date', today).order('event_date', { ascending: true }).order('event_time', { ascending: true, nullsFirst: true }).limit(1),
    supabase.from('polls').select('id,question,closes_on,closed').eq('closed', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('poll_votes').select('poll_id').eq('user_id', profile.id),
    supabase.from('quotes').select('id,content,speaker').order('created_at', { ascending: false }).limit(1),
  ]);
  const voted = new Set((mine.data ?? []).map(v => v.poll_id));
  const toVote = (polls.data ?? []).filter(p => !(p.closes_on && p.closes_on < today) && !voted.has(p.id));
  const next = events.data?.[0];
  const quote = quotes.data?.[0];
  const dateline = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Rome' }).format(new Date());
  const left = next ? daysTo(next.event_date, today) : 0;
  const [lead, ...others] = posts.data ?? [];
  const isNew = (iso: string) => since > 0 && new Date(iso).getTime() > since;
  const stampFor = (iso: string) => isNew(iso) ? <Tag state="done" label="nuovo dalla tua ultima visita">Nuovo</Tag> : ago(iso);
  const news = (posts.data ?? []).some(post => isNew(post.published_at));
  const scatto = arrive && news; // il momento: solo tornando dopo un po', e solo se c'è davvero qualcosa di nuovo
  const soonPoll = toVote.slice(0, 2).some(p => p.closes_on && daysTo(p.closes_on, today) <= 1);
  const covers = (albums.data ?? []).filter(album => album.photos?.[0]);
  return (
    <Screen>
      <h1 className="dateline" style={{ paddingBottom: 12 }}>{dateline}</h1>
      {posts.error ? <Slide><p className="foot">Impossibile caricare i post. Riprova più tardi.</p></Slide>
        : !lead ? <Slide><p className="foot">Qui inizia la storia. Il primo post aspetta solo voi.</p></Slide>
        : (
          <Link href={`/posts/${lead.slug}`} className="lead" transitionTypes={['nav-forward']}>
            {lead.cover_photo_id && <ViewTransition name={`cover-${lead.slug}`}><img src={`/media/${lead.cover_photo_id}?size=lead`} srcSet={`/media/${lead.cover_photo_id}?size=thumb 600w, /media/${lead.cover_photo_id}?size=lead 1200w`} sizes="(min-width: 640px) 640px, 100vw" alt="" /></ViewTransition>}
            <Slide shape="b" className={scatto ? 'arrive' : ''}>
              <Row when={stampFor(lead.published_at)} title={lead.title} sub={lead.content.slice(0, 160)} clamp />
            </Slide>
          </Link>
        )}
      {toVote.length > 0 && (
        <Slide title="Da votare" shape="c" tone="light" lean={soonPoll ? 'steep' : undefined}>
          {toVote.slice(0, 2).map(p => {
            const days = p.closes_on ? daysTo(p.closes_on, today) : null;
            return <Row key={p.id} when={<Tag state="open" label="non hai ancora votato">{days === null ? 'Aperto' : days === 0 ? 'Oggi' : days === 1 ? 'Domani' : `${days} giorni`}</Tag>} title={p.question} sub="Il tuo voto resta segreto" href="/polls" />;
          })}
        </Slide>
      )}
      {next && (
        <Link href="/events" className="plate" style={left <= 1 ? { ['--lean' as string]: '38px' } : undefined} transitionTypes={['nav-forward']} aria-label={`Prossimo evento: ${next.title}, ${left === 0 ? 'oggi' : left === 1 ? 'domani' : `tra ${left} giorni`}`}>
          <span className="big">
            <span className={`moment tnum ${scatto ? 'arrive' : ''}`}>{left}</span>
            <span><span className="lbl">{left === 0 ? 'Si esce oggi' : left === 1 ? 'giorno, è domani' : 'giorni a'}</span><strong>{next.title}</strong></span>
          </span>
          <span>{dayMonth(next.event_date)}{next.event_time ? ` · ${next.event_time.slice(0, 5)}` : ''}{next.location ? ` · ${next.location}` : ''}</span>
        </Link>
      )}
      {others.length > 0 && (
        <Slide title="Prima ancora" shape="a">
          {others.map(post => <Row key={post.id} when={stampFor(post.published_at)} title={post.title} href={`/posts/${post.slug}`} />)}
          <p className="foot"><Link href="/posts" transitionTypes={['nav-forward']}>Tutti i post<Icon name="next" /></Link></p>
        </Slide>
      )}
      {quote && (
        <section className="pane" aria-label="Citazione">
          <blockquote className="prose">“{quote.content}”</blockquote>
          <p><b>— {quote.speaker}</b></p>
        </section>
      )}
      {covers.length > 0 && (
        <>
          <SectionHead title="Foto recenti" href="/gallery" link="Gallery" />
          <div className="strip">
            {covers.map(album => (
              <Link key={album.id} href={`/gallery/${album.id}`} transitionTypes={['nav-forward']}>
                <ViewTransition name={`album-${album.id}`}><img src={`/media/${album.photos[0].id}?size=thumb`} alt="" loading="lazy" /></ViewTransition>
                <b>{album.title}</b>
              </Link>
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}
