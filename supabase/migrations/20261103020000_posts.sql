create function private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and status = 'active' and role = 'admin' and not must_change_password);
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 180),
  content text not null check (char_length(btrim(content)) between 1 and 50000),
  category text not null check (category in ('news','stories','cronache','viaggi','serate','meme','speciali')),
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'draft' and published_at is null) or (status = 'published' and published_at is not null))
);
create index posts_feed_idx on public.posts (published_at desc, id desc) where status = 'published';

create function private.prepare_post() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'draft' then new.published_at = null;
  elsif tg_op = 'INSERT' or old.status = 'draft' then new.published_at = now();
  end if;
  new.updated_at = now();
  return new;
end;
$$;
create trigger posts_prepare before insert or update on public.posts for each row execute function private.prepare_post();

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at, id);
create function private.touch_comment() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger comments_updated before update on public.comments for each row execute function private.touch_comment();

create table public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  emoji text not null check (emoji in ('😂','💀','🐆','🔥','🤡')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, emoji)
);

alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_reactions enable row level security;
revoke all on public.posts, public.comments, public.post_reactions from public, anon, authenticated;
grant select, delete on public.posts to authenticated;
grant insert (id, author_id, title, slug, content, category, status) on public.posts to authenticated;
grant update (title, content, category, status) on public.posts to authenticated;
grant select, delete on public.comments to authenticated;
grant insert (post_id, user_id, content) on public.comments to authenticated;
grant update (content) on public.comments to authenticated;
grant select, delete on public.post_reactions to authenticated;
grant insert (post_id, user_id, emoji) on public.post_reactions to authenticated;

create policy posts_select on public.posts for select to authenticated using ((select private.has_changed_password()) and (status = 'published' or (select private.is_admin())));
create policy posts_insert on public.posts for insert to authenticated with check ((select private.is_admin()) and author_id = (select auth.uid()));
create policy posts_update on public.posts for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy posts_delete on public.posts for delete to authenticated using ((select private.is_admin()));

create policy comments_select on public.comments for select to authenticated using ((select private.has_changed_password()) and exists (select 1 from public.posts p where p.id = post_id and (p.status = 'published' or (select private.is_admin()))));
create policy comments_insert on public.comments for insert to authenticated with check ((select private.has_changed_password()) and user_id = (select auth.uid()) and exists (select 1 from public.posts p where p.id = post_id and p.status = 'published'));
create policy comments_update on public.comments for update to authenticated using ((select private.has_changed_password()) and (user_id = (select auth.uid()) or (select private.is_admin())) and exists (select 1 from public.posts p where p.id = post_id and p.status = 'published')) with check ((select private.has_changed_password()) and (user_id = (select auth.uid()) or (select private.is_admin())));
create policy comments_delete on public.comments for delete to authenticated using ((select private.has_changed_password()) and (user_id = (select auth.uid()) or (select private.is_admin())) and exists (select 1 from public.posts p where p.id = post_id and (p.status = 'published' or (select private.is_admin()))));

create policy reactions_select on public.post_reactions for select to authenticated using ((select private.has_changed_password()) and exists (select 1 from public.posts p where p.id = post_id and p.status = 'published'));
create policy reactions_insert on public.post_reactions for insert to authenticated with check ((select private.has_changed_password()) and user_id = (select auth.uid()) and exists (select 1 from public.posts p where p.id = post_id and p.status = 'published'));
create policy reactions_delete on public.post_reactions for delete to authenticated using ((select private.has_changed_password()) and user_id = (select auth.uid()) and exists (select 1 from public.posts p where p.id = post_id and p.status = 'published'));
