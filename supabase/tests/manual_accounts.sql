begin;
select plan(6);
insert into auth.users (id, email, encrypted_password) values
  ('00000000-0000-0000-0000-000000000011', 'new@example.test', 'old'),
  ('00000000-0000-0000-0000-000000000012', 'other@example.test', 'old');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', true);
select is((select count(*) from public.profiles), 1::bigint, 'new member can only read own profile');
select results_eq($$update public.profiles set display_name = 'Test' where id = '00000000-0000-0000-0000-000000000011' returning 1$$, $$select 1 where false$$, 'new member cannot change profile before password');
select throws_ok($$update public.profiles set must_change_password = false where id = '00000000-0000-0000-0000-000000000011'$$, '42501', null, 'member cannot clear password flag');
reset role;
update auth.users set encrypted_password = 'new' where id = '00000000-0000-0000-0000-000000000011';
select is((select must_change_password from public.profiles where id = '00000000-0000-0000-0000-000000000011'), false, 'password update clears flag');
set local role authenticated;
select is((select count(*) from public.profiles where id in ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000012')), 2::bigint, 'member can read active profiles after password change');
select lives_ok($$update public.profiles set display_name = 'Test' where id = '00000000-0000-0000-0000-000000000011'$$, 'member can update own profile after password change');
select * from finish();
rollback;
