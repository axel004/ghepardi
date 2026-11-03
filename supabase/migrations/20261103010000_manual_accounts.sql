alter table public.profiles add column must_change_password boolean not null default false;
alter table public.profiles alter column must_change_password set default true;

create function private.has_changed_password() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and status = 'active' and not must_change_password);
$$;
revoke all on function private.has_changed_password() from public;
grant execute on function private.has_changed_password() to authenticated;

create function private.password_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set must_change_password = false where id = new.id and must_change_password;
  return new;
end;
$$;
revoke all on function private.password_changed() from public;
create trigger on_auth_password_changed after update of encrypted_password on auth.users
  for each row when (old.encrypted_password is distinct from new.encrypted_password and new.encrypted_password is not null)
  execute function private.password_changed();

drop policy profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using ((select private.is_active()) and status = 'active' and
    (id = (select auth.uid()) or (select private.has_changed_password())));
drop policy profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using ((select private.has_changed_password()) and id = (select auth.uid()))
  with check ((select private.has_changed_password()) and id = (select auth.uid()));
