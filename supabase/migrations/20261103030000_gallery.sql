create table public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  event_date date,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
create table public.photos (
  id uuid primary key,
  album_id uuid not null references public.albums(id) on delete restrict,
  storage_path text not null unique,
  caption text check (caption is null or char_length(caption) <= 200),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (storage_path = album_id::text || '/' || id::text || '.jpg')
);
create index photos_album_idx on public.photos (album_id, created_at desc, id desc);
alter table public.posts add column cover_photo_id uuid references public.photos(id) on delete set null;
grant insert (cover_photo_id) on public.posts to authenticated;
grant update (cover_photo_id) on public.posts to authenticated;

alter table public.albums enable row level security;
alter table public.photos enable row level security;
revoke all on public.albums, public.photos from public, anon, authenticated;
grant select, delete on public.albums, public.photos to authenticated;
grant insert (id, title, event_date, created_by) on public.albums to authenticated;
grant update (title, event_date) on public.albums to authenticated;
grant insert (id, album_id, storage_path, caption, created_by) on public.photos to authenticated;
grant update (caption) on public.photos to authenticated;
create policy albums_read on public.albums for select to authenticated using ((select private.has_changed_password()));
create policy albums_insert on public.albums for insert to authenticated with check ((select private.is_admin()) and created_by = (select auth.uid()));
create policy albums_update on public.albums for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy albums_delete on public.albums for delete to authenticated using ((select private.is_admin()));
create policy photos_read on public.photos for select to authenticated using ((select private.has_changed_password()));
create policy photos_insert on public.photos for insert to authenticated with check ((select private.is_admin()) and created_by = (select auth.uid()));
create policy photos_update on public.photos for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy photos_delete on public.photos for delete to authenticated using ((select private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ghepardi-gallery', 'ghepardi-gallery', false, 3145728, array['image/jpeg']);
create policy gallery_objects_read on storage.objects for select to authenticated using (
  bucket_id = 'ghepardi-gallery' and (select private.has_changed_password()) and
  ((select private.is_admin()) or exists (select 1 from public.photos p where p.storage_path = name))
);
create policy gallery_objects_insert on storage.objects for insert to authenticated with check (bucket_id = 'ghepardi-gallery' and (select private.is_admin()));
create policy gallery_objects_delete on storage.objects for delete to authenticated using (bucket_id = 'ghepardi-gallery' and (select private.is_admin()));
