alter table public.comments add column parent_id uuid references public.comments(id) on delete set null;
create index comments_parent_idx on public.comments (parent_id) where parent_id is not null;
grant insert (parent_id) on public.comments to authenticated;

create function private.check_comment_parent() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.parent_id is not null and not exists (select 1 from public.comments c where c.id = new.parent_id and c.post_id = new.post_id) then
    raise exception 'reply must belong to the same post';
  end if;
  return new;
end;
$$;
revoke all on function private.check_comment_parent() from public;
create trigger comments_parent_check before insert or update of parent_id, post_id on public.comments for each row execute function private.check_comment_parent();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  post_id uuid not null references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  kind text not null check (kind in ('mention', 'reply')),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create unique index notifications_comment_unique on public.notifications (recipient_id, comment_id) where comment_id is not null;
create unique index notifications_post_unique on public.notifications (recipient_id, post_id) where comment_id is null;
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc, id desc);
alter table public.notifications enable row level security;
revoke all on public.notifications from public, anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy notifications_read on public.notifications for select to authenticated using ((select private.has_changed_password()) and recipient_id = (select auth.uid()) and exists (select 1 from public.posts p where p.id = post_id and p.status = 'published'));
create policy notifications_update on public.notifications for update to authenticated using ((select private.has_changed_password()) and recipient_id = (select auth.uid()) and exists (select 1 from public.posts p where p.id = post_id and p.status = 'published')) with check ((select private.has_changed_password()) and recipient_id = (select auth.uid()));

create function private.notify_comment() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.posts p where p.id = new.post_id and p.status = 'published') then return new; end if;
  if new.parent_id is not null and tg_op = 'INSERT' then
    insert into public.notifications(recipient_id, actor_id, post_id, comment_id, kind)
      select c.user_id, new.user_id, new.post_id, new.id, 'reply' from public.comments c join public.profiles p on p.id = c.user_id
      where c.id = new.parent_id and c.user_id <> new.user_id and p.status = 'active' and not p.must_change_password
      on conflict do nothing;
  end if;
  insert into public.notifications(recipient_id, actor_id, post_id, comment_id, kind)
    select distinct p.id, new.user_id, new.post_id, new.id, 'mention' from public.profiles p
    where p.status = 'active' and not p.must_change_password and p.id <> new.user_id and p.username in
      (select matches[2] from regexp_matches(new.content, '(^|[^a-zA-Z0-9_])@([a-z0-9_]{3,30})(?![a-zA-Z0-9_])', 'g') matches)
    on conflict do nothing;
  return new;
end;
$$;
revoke all on function private.notify_comment() from public;
create trigger comment_notifications after insert or update of content on public.comments for each row execute function private.notify_comment();

create function private.notify_post_mentions() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status <> 'published' then return new; end if;
  insert into public.notifications(recipient_id, actor_id, post_id, kind)
    select distinct p.id, new.author_id, new.id, 'mention' from public.profiles p
    where p.status = 'active' and not p.must_change_password and p.id <> new.author_id and p.username in
      (select matches[2] from regexp_matches(new.title || E'\n' || new.content, '(^|[^a-zA-Z0-9_])@([a-z0-9_]{3,30})(?![a-zA-Z0-9_])', 'g') matches)
    on conflict do nothing;
  return new;
end;
$$;
revoke all on function private.notify_post_mentions() from public;
create trigger post_mention_notifications after insert or update of title, content, status on public.posts for each row execute function private.notify_post_mentions();

alter table public.poll_votes add column created_at timestamptz;
alter table public.poll_votes alter column created_at set default now();
alter table public.quote_votes add column created_at timestamptz;
alter table public.quote_votes alter column created_at set default now();

create view public.activity_feed with (security_invoker = true) as
  select 'post:' || p.id as id, p.published_at as happened_at, 'post'::text as kind, p.title as title, '/posts/' || p.slug as path, p.author_id as actor_id from public.posts p where p.status = 'published'
  union all select 'comment:' || c.id, c.created_at, 'comment', p.title, '/posts/' || p.slug || '?focus=' || c.id || '#comment-' || c.id, c.user_id from public.comments c join public.posts p on p.id = c.post_id and p.status = 'published'
  union all select 'photo:' || ph.id, ph.created_at, 'photo', a.title, '/gallery/' || a.id, ph.created_by from public.photos ph join public.albums a on a.id = ph.album_id
  union all select 'poll:' || p.id, p.created_at, 'poll', p.question, '/polls', null::uuid from public.polls p
  union all select 'quote:' || q.id, q.created_at, 'quote', left(q.content, 120), '/quotes', q.submitted_by from public.quotes q
  union all select 'event:' || e.id, e.created_at, 'event', e.title, '/events', null::uuid from public.events e
  union all select 'award:' || a.id, a.created_at, 'award', a.title, '/awards', null::uuid from public.awards a
  union all select 'monthly:' || m.id, m.created_at, 'monthly', m.title, '/monthly', null::uuid from public.monthly_features m
  union all select 'hall:' || h.id, h.created_at, 'hall', h.title, case when h.hall = 'fame' then '/hall-of-fame' else '/hall-of-shame' end, null::uuid from public.hall_entries h;
revoke all on public.activity_feed from public, anon, authenticated;
grant select on public.activity_feed to authenticated;

create function public.wrapped_vote_counts(wrapped_year integer) returns table (poll_votes bigint, quote_votes bigint, undated_votes bigint)
language sql stable security definer set search_path = '' as $$
  select (select count(*) from public.poll_votes v where v.created_at >= make_timestamptz(wrapped_year, 1, 1, 0, 0, 0, 'UTC') and v.created_at < make_timestamptz(wrapped_year + 1, 1, 1, 0, 0, 0, 'UTC')),
         (select count(*) from public.quote_votes v where v.created_at >= make_timestamptz(wrapped_year, 1, 1, 0, 0, 0, 'UTC') and v.created_at < make_timestamptz(wrapped_year + 1, 1, 1, 0, 0, 0, 'UTC')),
         (select count(*) from public.poll_votes v where v.created_at is null) + (select count(*) from public.quote_votes v where v.created_at is null)
  where private.has_changed_password() and wrapped_year between 2000 and 2100;
$$;
revoke all on function public.wrapped_vote_counts(integer) from public, anon;
grant execute on function public.wrapped_vote_counts(integer) to authenticated;

create function public.wrapped_poll_winners(wrapped_year integer) returns table (poll_id uuid, question text, label text, votes bigint)
language sql stable security definer set search_path = '' as $$
  with totals as (
    select p.id as poll_id, p.question, o.label, count(v.user_id) as votes,
      rank() over (partition by p.id order by count(v.user_id) desc) as place
    from public.polls p join public.poll_options o on o.poll_id = p.id
    join public.poll_votes v on v.poll_id = p.id and v.option_id = o.id
    where private.has_changed_password() and wrapped_year between 2000 and 2100
      and p.created_at >= make_timestamptz(wrapped_year, 1, 1, 0, 0, 0, 'UTC') and p.created_at < make_timestamptz(wrapped_year + 1, 1, 1, 0, 0, 0, 'UTC')
      and (p.closed or p.closes_on < (now() at time zone 'Europe/Rome')::date)
    group by p.id, p.question, o.id, o.label
  ) select t.poll_id, t.question, t.label, t.votes from totals t where t.place = 1 order by t.question, t.label;
$$;
revoke all on function public.wrapped_poll_winners(integer) from public, anon;
grant execute on function public.wrapped_poll_winners(integer) to authenticated;
