create table public.monthly_features (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  feature_month date not null check (extract(day from feature_month) = 1 and feature_month between '1900-01-01' and '2100-12-01'),
  subject text not null check (char_length(btrim(subject)) between 1 and 120),
  description text check (description is null or char_length(description) <= 2000),
  photo_id uuid references public.photos(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.awards (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  member_id uuid references public.profiles(id) on delete set null,
  award_year integer not null check (award_year between 1900 and 2100),
  description text check (description is null or char_length(description) <= 2000),
  created_at timestamptz not null default now()
);
create table public.hall_entries (
  id uuid primary key default gen_random_uuid(),
  hall text not null check (hall in ('fame', 'shame')),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  entry_year integer not null check (entry_year between 1900 and 2100),
  description text check (description is null or char_length(description) <= 2000),
  photo_id uuid references public.photos(id) on delete set null,
  created_at timestamptz not null default now()
);
create index monthly_features_order_idx on public.monthly_features (feature_month desc, id desc);
create index awards_order_idx on public.awards (award_year desc, id desc);
create index awards_member_idx on public.awards (member_id);
create index hall_entries_order_idx on public.hall_entries (hall, entry_year desc, id desc);
alter table public.monthly_features enable row level security;
alter table public.awards enable row level security;
alter table public.hall_entries enable row level security;
revoke all on public.monthly_features, public.awards, public.hall_entries from public, anon, authenticated;
grant select, insert, update, delete on public.monthly_features, public.awards, public.hall_entries to authenticated;
create policy monthly_read on public.monthly_features for select to authenticated using ((select private.has_changed_password()));
create policy monthly_write on public.monthly_features for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy awards_read on public.awards for select to authenticated using ((select private.has_changed_password()));
create policy awards_write on public.awards for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy hall_read on public.hall_entries for select to authenticated using ((select private.has_changed_password()));
create policy hall_write on public.hall_entries for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
