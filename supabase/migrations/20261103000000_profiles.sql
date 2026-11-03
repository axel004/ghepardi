create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  username text check (username is null or username ~ '^[a-z0-9_]{3,30}$'),
  display_name text check (display_name is null or char_length(btrim(display_name)) between 1 and 80),
  bio text check (bio is null or char_length(bio) <= 500),
  avatar_path text check (avatar_path is null or avatar_path like id::text || '/%'),
  role text not null default 'member' check (role in ('member', 'admin')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_username_unique on public.profiles (lower(username));
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create function private.is_active() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and status = 'active');
$$;
revoke all on function private.is_active() from public;
grant execute on function private.is_active() to authenticated;
create function private.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles (id) values (new.id); return new; end;
$$;
revoke all on function private.create_profile() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.create_profile();
create function private.touch_profile() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_updated before update on public.profiles for each row execute function private.touch_profile();
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username, display_name, bio) on public.profiles to authenticated;
create policy profiles_read on public.profiles for select to authenticated
  using ((select private.is_active()) and status = 'active');
create policy profiles_update_self on public.profiles for update to authenticated
  using ((select private.is_active()) and id = (select auth.uid()))
  with check ((select private.is_active()) and id = (select auth.uid()));
