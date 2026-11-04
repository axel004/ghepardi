create table public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(btrim(question)) between 1 and 200),
  closes_on date,
  closed boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 120),
  position smallint not null check (position between 1 and 6),
  unique (poll_id, position), unique (poll_id, id)
);
create table public.poll_votes (
  poll_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  option_id uuid not null,
  primary key (poll_id, user_id),
  foreign key (poll_id, option_id) references public.poll_options(poll_id, id) on delete cascade
);
create table public.rankings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  created_at timestamptz not null default now()
);
create table public.ranking_entries (
  id uuid primary key default gen_random_uuid(),
  ranking_id uuid not null references public.rankings(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  points integer not null check (points between -1000000 and 1000000),
  unique (ranking_id, name)
);
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  event_date date not null,
  event_time time,
  location text check (location is null or char_length(location) <= 160),
  description text check (description is null or char_length(description) <= 2000),
  created_at timestamptz not null default now()
);

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.rankings enable row level security;
alter table public.ranking_entries enable row level security;
alter table public.events enable row level security;
revoke all on public.polls, public.poll_options, public.poll_votes, public.rankings, public.ranking_entries, public.events from public, anon, authenticated;
grant select on public.polls, public.poll_options, public.rankings, public.ranking_entries, public.events to authenticated;
grant select on public.poll_votes to authenticated;
grant insert (poll_id, user_id, option_id) on public.poll_votes to authenticated;
grant update (closed) on public.polls to authenticated;
grant delete on public.polls to authenticated;
grant insert, update, delete on public.rankings, public.ranking_entries, public.events to authenticated;

create policy polls_read on public.polls for select to authenticated using ((select private.has_changed_password()));
create policy options_read on public.poll_options for select to authenticated using ((select private.has_changed_password()));
create policy votes_read_own on public.poll_votes for select to authenticated using ((select private.has_changed_password()) and user_id = (select auth.uid()));
create policy votes_insert on public.poll_votes for insert to authenticated with check ((select private.has_changed_password()) and user_id = (select auth.uid()) and exists (select 1 from public.polls p where p.id = poll_id and not p.closed and (p.closes_on is null or p.closes_on >= (now() at time zone 'Europe/Rome')::date)));
create policy polls_close on public.polls for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy polls_delete on public.polls for delete to authenticated using ((select private.is_admin()));
create policy rankings_read on public.rankings for select to authenticated using ((select private.has_changed_password()));
create policy rankings_write on public.rankings for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy entries_read on public.ranking_entries for select to authenticated using ((select private.has_changed_password()));
create policy entries_write on public.ranking_entries for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy events_read on public.events for select to authenticated using ((select private.has_changed_password()));
create policy events_write on public.events for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create function public.create_poll(question_text text, option_labels text[], closing_date date default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare poll_id uuid; label text; pos integer := 0;
begin
  if not private.is_admin() then raise exception 'not allowed'; end if;
  if char_length(btrim(coalesce(question_text, ''))) not between 1 and 200 or coalesce(array_length(option_labels, 1), 0) not between 2 and 6 then raise exception 'invalid poll'; end if;
  if closing_date is not null and closing_date < (now() at time zone 'Europe/Rome')::date then raise exception 'invalid date'; end if;
  if exists (select 1 from unnest(option_labels) v where v is null or char_length(btrim(v)) not between 1 and 120) or (select count(distinct lower(btrim(v))) from unnest(option_labels) v) <> array_length(option_labels, 1) then raise exception 'invalid options'; end if;
  insert into public.polls(question, closes_on) values (btrim(question_text), closing_date) returning id into poll_id;
  foreach label in array option_labels loop
    pos := pos + 1;
    insert into public.poll_options(poll_id, label, position) values (poll_id, btrim(label), pos);
  end loop;
  return poll_id;
end;
$$;
revoke all on function public.create_poll(text, text[], date) from public, anon;
grant execute on function public.create_poll(text, text[], date) to authenticated;

create function public.poll_results() returns table (option_id uuid, votes bigint)
language sql stable security definer set search_path = '' as $$
  select v.option_id, count(*) from public.poll_votes v where private.has_changed_password() group by v.option_id;
$$;
revoke all on function public.poll_results() from public, anon;
grant execute on function public.poll_results() to authenticated;
