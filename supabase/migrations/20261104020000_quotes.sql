create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  content text not null check (char_length(btrim(content)) between 1 and 1000),
  speaker text not null check (char_length(btrim(speaker)) between 1 and 80),
  created_at timestamptz not null default now()
);
create table public.quote_votes (
  quote_id uuid not null references public.quotes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (quote_id, user_id)
);
alter table public.quotes enable row level security;
alter table public.quote_votes enable row level security;
revoke all on public.quotes, public.quote_votes from public, anon, authenticated;
grant select, delete on public.quotes, public.quote_votes to authenticated;
grant insert (submitted_by, content, speaker) on public.quotes to authenticated;
grant insert (quote_id, user_id) on public.quote_votes to authenticated;
create policy quotes_read on public.quotes for select to authenticated using ((select private.has_changed_password()));
create policy quotes_insert on public.quotes for insert to authenticated with check ((select private.has_changed_password()) and submitted_by = (select auth.uid()));
create policy quotes_delete on public.quotes for delete to authenticated using ((select private.has_changed_password()) and (submitted_by = (select auth.uid()) or (select private.is_admin())));
create policy quote_votes_read on public.quote_votes for select to authenticated using ((select private.has_changed_password()));
create policy quote_votes_insert on public.quote_votes for insert to authenticated with check ((select private.has_changed_password()) and user_id = (select auth.uid()));
create policy quote_votes_delete on public.quote_votes for delete to authenticated using ((select private.has_changed_password()) and user_id = (select auth.uid()));
