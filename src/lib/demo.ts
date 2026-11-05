/* Modalità demo: solo sviluppo, solo con GHEPARDI_DEMO=1. Dati sintetici per vedere le schermate senza Supabase.
   Non si attiva mai in produzione e non scrive nulla da nessuna parte. */
export const demo = process.env.GHEPARDI_DEMO === '1' && process.env.NODE_ENV !== 'production';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const day = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const ts = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3600000).toISOString();

export const demoProfile = { id: id(1), username: 'marta', display_name: 'Marta', bio: 'Tiene i conti. Perde sempre.', role: 'admin', must_change_password: false };
const member = (n: number, username: string, display_name: string, bio: string | null, role = 'member') => ({ id: id(n), username, display_name, bio, role, status: 'active' });
const members = [
  member(1, 'marta', 'Marta', 'Tiene i conti. Perde sempre.', 'admin'),
  member(2, 'davide', 'Davide', 'Il sentiero lo conosce.'),
  member(3, 'gigi', 'Gigi', 'Padrone di casa e della sedia dispersa.'),
  member(4, 'sofia', 'Sofia', null),
  member(5, 'luca', 'Luca', 'Arriva sempre dopo il dolce.'),
  member(6, 'toto', 'Totò', 'Una pizza e passa tutto.'),
];
const who = (n: number) => ({ display_name: members[n - 1].display_name, username: members[n - 1].username });

const photos = [10, 11, 12, 13, 14, 15, 16, 17].map(n => ({ id: id(n), album_id: id(n < 14 ? 20 : 21), caption: n === 10 ? 'Vetta, o quasi' : null, created_at: ts(n) }));
const options = (poll: number, labels: string[]) => labels.map((label, i) => ({ id: id(poll * 10 + i + 1), label, position: i + 1 }));

const tables: Record<string, unknown[]> = {
  profiles: members,
  posts: [
    { id: id(30), slug: 'il-verbale-della-cena-da-gigi', title: 'Il verbale della cena da Gigi', category: 'cronache', status: 'published', cover_photo_id: id(10), published_at: ts(5),
      content: 'Presenti quattro firmatari e un conto da dividere. Si dà atto che una sedia non è più reperibile.\n\nGigi ha dichiarato di non saperne nulla. @davide ha dichiarato di saperne troppo. Letto, confermato, sottoscritto.' },
    { id: id(31), slug: 'montagna-senza-gambe', title: 'Montagna senza gambe', category: 'viaggi', status: 'published', cover_photo_id: id(13), published_at: ts(30),
      content: 'Tre ore di salita, undici minuti di panorama, un solo bagno aperto. Le foto sono nell’album, il dolore è nei polpacci di tutti.' },
    { id: id(32), slug: 'il-meme-della-settimana', title: 'Il meme della settimana', category: 'meme', status: 'published', cover_photo_id: null, published_at: ts(80),
      content: 'Votato all’unanimità, citato in tre conversazioni, ricondiviso da Luca con tre ore di ritardo.' },
  ],
  comments: [
    { id: id(40), user_id: id(2), parent_id: null, content: 'Contesto la sedia. Era già dispersa prima.', created_at: ts(4), profiles: who(2) },
    { id: id(41), user_id: id(3), parent_id: id(40), content: '@davide non iniziare.', created_at: ts(3), profiles: who(3) },
    { id: id(42), user_id: id(5), parent_id: null, content: 'Io il dolce l’ho preso, per la cronaca.', created_at: ts(2), profiles: who(5) },
  ],
  post_reactions: [{ emoji: '😂', user_id: id(2) }, { emoji: '😂', user_id: id(3) }, { emoji: '🐆', user_id: id(1) }, { emoji: '🔥', user_id: id(5) }],
  albums: [
    { id: id(20), title: 'Montagna senza gambe', event_date: day(-9), created_at: ts(30), photos: [photos[0]] },
    { id: id(21), title: 'Cena da Gigi', event_date: day(-2), created_at: ts(6), photos: [photos[4]] },
    { id: id(22), title: 'Capodanno scorso', event_date: null, created_at: ts(900), photos: [] },
  ],
  photos,
  polls: [
    { id: id(50), question: 'Dove si va sabato?', closes_on: day(2), closed: false, created_at: ts(20), poll_options: options(50, ['Pizzeria da Totò', 'Si va in montagna', 'Divano e niente']) },
    { id: id(51), question: 'Miglior dolce della stagione?', closes_on: null, closed: false, created_at: ts(60), poll_options: options(51, ['Tiramisù', 'Babà', 'Niente, siamo a dieta']) },
    { id: id(52), question: 'Chi paga il prossimo giro?', closes_on: day(-3), closed: true, created_at: ts(300), poll_options: options(52, ['Gigi', 'Luca', 'Si tira a sorte']) },
  ],
  poll_votes: [{ poll_id: id(51), option_id: id(511) }, { poll_id: id(52), option_id: id(522) }],
  rankings: [
    { id: id(60), title: 'Ritardi cronici', created_at: ts(50), ranking_entries: [{ id: id(601), name: 'Luca', points: 14 }, { id: id(602), name: 'Gigi', points: 9 }, { id: id(603), name: 'Totò', points: 9 }, { id: id(604), name: 'Marta', points: 2 }] },
    { id: id(61), title: 'Cene organizzate', created_at: ts(90), ranking_entries: [{ id: id(611), name: 'Gigi', points: 7 }, { id: id(612), name: 'Marta', points: 5 }, { id: id(613), name: 'Sofia', points: 3 }] },
  ],
  events: [
    { id: id(70), title: 'Cena di fine stagione', event_date: day(9), event_time: '20:30:00', location: 'Da Totò', description: 'Si porta la voglia di mangiare e una sedia a testa.' },
    { id: id(71), title: 'Calcetto, il ritorno', event_date: day(16), event_time: null, location: null, description: null },
    { id: id(72), title: 'Compleanno di Sofia', event_date: day(-20), event_time: '21:00:00', location: 'Casa di Sofia', description: 'Torta compresa.' },
  ],
  quotes: [
    { id: id(80), content: 'Io il sentiero lo conosco.', speaker: 'Davide', submitted_by: id(1), quote_votes: [{ user_id: id(2) }, { user_id: id(3) }, { user_id: id(1) }] },
    { id: id(81), content: 'Non è tardi, è presto per domani.', speaker: 'Luca', submitted_by: id(2), quote_votes: [{ user_id: id(5) }] },
  ],
  activity_feed: [
    { id: id(90), happened_at: ts(1), kind: 'comment', title: 'Il verbale della cena da Gigi', path: '/posts/il-verbale-della-cena-da-gigi', actor_id: id(5) },
    { id: id(91), happened_at: ts(5), kind: 'post', title: 'Il verbale della cena da Gigi', path: '/posts/il-verbale-della-cena-da-gigi', actor_id: id(1) },
    { id: id(92), happened_at: ts(20), kind: 'poll', title: 'Dove si va sabato?', path: '/polls', actor_id: null },
    { id: id(93), happened_at: ts(30), kind: 'photo', title: 'Montagna senza gambe', path: `/gallery/${id(20)}`, actor_id: id(2) },
  ],
  notifications: [
    { id: id(100), kind: 'mention', comment_id: id(41), created_at: ts(3), read_at: null, posts: { slug: 'il-verbale-della-cena-da-gigi', title: 'Il verbale della cena da Gigi' }, profiles: who(3), recipient_id: id(1) },
    { id: id(101), kind: 'reply', comment_id: id(40), created_at: ts(4), read_at: null, posts: { slug: 'il-verbale-della-cena-da-gigi', title: 'Il verbale della cena da Gigi' }, profiles: who(2), recipient_id: id(1) },
    { id: id(102), kind: 'mention', comment_id: null, created_at: ts(70), read_at: ts(60), posts: { slug: 'montagna-senza-gambe', title: 'Montagna senza gambe' }, profiles: who(5), recipient_id: id(1) },
  ],
  monthly_features: [
    { id: id(110), title: 'Meme del mese', feature_month: `${day(-5).slice(0, 7)}-01`, subject: 'La sedia dispersa', description: 'Candidata dall’intero tavolo.', photo_id: id(11) },
    { id: id(111), title: 'Ragazza del mese', feature_month: `${day(-40).slice(0, 7)}-01`, subject: 'Sofia', description: null, photo_id: null },
  ],
  awards: [
    { id: id(120), title: 'Il ritardatario d’oro', award_year: new Date().getUTCFullYear(), member_id: id(5), description: 'Per la costanza.', profiles: who(5) },
    { id: id(121), title: 'Cuoca dell’anno', award_year: new Date().getUTCFullYear(), member_id: id(1), description: null, profiles: who(1) },
  ],
  hall_entries: [
    { id: id(130), hall: 'fame', title: 'La vetta senza scarpe adatte', entry_year: new Date().getUTCFullYear(), description: 'Arrivati. Contro ogni pronostico.', photo_id: id(10) },
    { id: id(131), hall: 'shame', title: 'La sedia di Gigi', entry_year: new Date().getUTCFullYear(), description: 'Mai ritrovata.', photo_id: null },
  ],
};

const rpcs: Record<string, unknown> = {
  poll_results: [{ option_id: id(501), votes: 5 }, { option_id: id(502), votes: 3 }, { option_id: id(503), votes: 1 }, { option_id: id(511), votes: 4 }, { option_id: id(512), votes: 2 }, { option_id: id(521), votes: 1 }, { option_id: id(522), votes: 4 }],
  wrapped_vote_counts: { poll_votes: 33, quote_votes: 18, undated_votes: 0 },
  wrapped_poll_winners: [{ poll_id: id(52), question: 'Chi paga il prossimo giro?', label: 'Si tira a sorte', votes: 4 }],
};

type Row = Record<string, unknown>;
function builder(table: string | null, source: unknown) {
  let rows: Row[] = Array.isArray(source) ? [...(source as Row[])] : [];
  let head = false;
  const settle = () => ({ data: head ? null : Array.isArray(source) ? rows : source, error: null, count: rows.length });
  const single = () => ({ data: Array.isArray(source) ? rows[0] ?? null : source, error: null });
  const proxy: unknown = new Proxy({}, {
    get(_t, prop: string) {
      if (prop === 'then') return (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(settle()).then(res, rej);
      if (prop === 'maybeSingle' || prop === 'single') return () => Promise.resolve(single());
      return (...args: unknown[]) => {
        if (prop === 'select' && args[1] && (args[1] as { head?: boolean }).head) head = true;
        if (prop === 'eq' && typeof args[0] === 'string') { const [k, v] = args as [string, unknown]; if (rows.length && k in rows[0]) rows = rows.filter(r => r[k] === v); }
        if (prop === 'is' && typeof args[0] === 'string' && args[1] === null) { const k = args[0]; if (rows.length && k in rows[0]) rows = rows.filter(r => r[k] === null); }
        if (prop === 'ilike' && typeof args[0] === 'string') { const k = args[0], needle = String(args[1]).toLowerCase(); rows = rows.filter(r => String(r[k] ?? '').toLowerCase().includes(needle)); }
        if (prop === 'limit' && typeof args[0] === 'number' && args.length === 1) rows = rows.slice(0, args[0]);
        return proxy;
      };
    },
  });
  void table;
  return proxy;
}

export function demoClient() {
  return {
    from: (table: string) => builder(table, tables[table] ?? []),
    rpc: (name: string) => builder(null, rpcs[name] ?? []),
    auth: { getClaims: async () => ({ data: { claims: { sub: demoProfile.id } }, error: null }), signOut: async () => ({}) },
    storage: { from: () => ({ download: async () => ({ data: null, error: new Error('demo') }) }) },
  } as unknown as Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>;
}
