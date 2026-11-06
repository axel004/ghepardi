import { requireReadyMember } from '@/lib/auth';
import { createEvent, deleteClubItem } from '../club-actions';
import { Back, Empty, Head, Notice, Row, Screen, Slide, dayMonth } from '@/components/ui';
import { Submit } from '@/components/submit';

export const metadata = { title: 'Eventi' };

type Event = { id: string; title: string; event_date: string; event_time: string | null; location: string | null; description: string | null };
function EventForm({ event }: { event?: Event }) {
  const suffix = event?.id ?? 'new';
  return (
    <form action={createEvent} className="form">
      {event && <input type="hidden" name="id" value={event.id} />}
      <label htmlFor={`title-${suffix}`}>Titolo</label><input id={`title-${suffix}`} name="title" maxLength={120} required defaultValue={event?.title} />
      <label htmlFor={`date-${suffix}`}>Data</label><input id={`date-${suffix}`} name="date" type="date" required defaultValue={event?.event_date} />
      <label htmlFor={`time-${suffix}`}>Ora <small>(facoltativa)</small></label><input id={`time-${suffix}`} name="time" type="time" defaultValue={event?.event_time?.slice(0, 5)} />
      <label htmlFor={`location-${suffix}`}>Luogo <small>(facoltativo)</small></label><input id={`location-${suffix}`} name="location" maxLength={160} defaultValue={event?.location ?? ''} />
      <label htmlFor={`description-${suffix}`}>Dettagli <small>(facoltativi)</small></label><textarea id={`description-${suffix}`} name="description" maxLength={2000} rows={3} defaultValue={event?.description ?? ''} />
      <div className="btn-row"><Submit>{event ? 'Salva modifiche' : 'Crea evento'}</Submit></div>
    </form>
  );
}

export default async function Events({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { supabase, profile } = await requireReadyMember(), query = await searchParams;
  const { data, error } = await supabase.from('events').select('id,title,event_date,event_time,location,description').order('event_date', { ascending: false }).order('event_time', { ascending: false, nullsFirst: false }).limit(100);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const upcoming = data?.filter(event => event.event_date >= today).reverse() ?? [], past = data?.filter(event => event.event_date < today) ?? [];
  const admin = profile.role === 'admin';
  const list = (events: Event[]) => events.map(event => (
    <div key={event.id}>
      <Row when={dayMonth(event.event_date)} title={event.title}
        sub={[event.event_time?.slice(0, 5), event.location].filter(Boolean).join(' · ') || undefined} mark={<span />} />
      {event.description && <p className="foot" style={{ paddingLeft: 'calc(4.6rem + 12px)' }}>{event.description}</p>}
      {admin && <details><summary>Modifica o elimina</summary>
        <EventForm event={event} />
        <form action={deleteClubItem}><input type="hidden" name="kind" value="events" /><input type="hidden" name="id" value={event.id} /><div className="btn-row"><button className="btn ghost">Elimina evento</button></div></form>
      </details>}
    </div>
  ));
  return (
    <Screen>
      <Back href="/altro">Altro</Back>
      <Head title="Eventi">Cene, viaggi, compleanni e altre ottime scuse.</Head>
      {query.error && <Notice kind="err">Controlla i dati e riprova.</Notice>}
      {query.saved && <Notice>Evento aggiornato.</Notice>}
      {admin && <Slide shape="b" tone="light"><details><summary>Crea un evento</summary><EventForm /></details></Slide>}
      {error ? <Empty title="Non si carica">Impossibile caricare gli eventi.</Empty>
        : !data?.length ? <Empty title="Calendario vuoto">Il calendario aspetta il branco.</Empty>
        : <>
          {upcoming.length > 0 && <Slide title="In arrivo" shape="a" lean={Date.parse(`${upcoming[0].event_date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`) <= 86400000 ? 'steep' : undefined}>{list(upcoming)}</Slide>}
          {past.length > 0 && <Slide title="Già successi" shape="c" tone="light" lean="upright">{list(past)}</Slide>}
        </>}
    </Screen>
  );
}
