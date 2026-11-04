begin;
select plan(9);
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'one@example.test'),
  ('00000000-0000-0000-0000-000000000002', 'two@example.test');
update public.profiles set must_change_password = false where id in ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
select is((select count(*) from public.profiles where id in ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')), 2::bigint, 'trigger creates profiles');
set local role anon;
select throws_ok('select * from public.profiles', '42501', null, 'anonymous cannot read profiles');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select is((select count(*) from public.profiles where id in ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')), 2::bigint, 'active member reads active profiles');
select lives_ok($$update public.profiles set username = 'one', display_name = 'One' where id = '00000000-0000-0000-0000-000000000001'$$, 'member updates own permitted fields');
select throws_ok($$update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000001'$$, '42501', null, 'member cannot change role');
select results_eq($$update public.profiles set display_name = 'Changed' where id = '00000000-0000-0000-0000-000000000002' returning 1$$, $$select 1 where false$$, 'member cannot update another profile');
reset role;
update public.profiles set status = 'disabled' where id = '00000000-0000-0000-0000-000000000001';
set local role authenticated;
select is((select count(*) from public.profiles), 0::bigint, 'disabled member loses read access with same JWT');
select results_eq($$update public.profiles set display_name = 'Changed' where id = '00000000-0000-0000-0000-000000000001' returning 1$$, $$select 1 where false$$, 'disabled member cannot update');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
select is((select count(*) from public.profiles), 0::bigint, 'missing profile has no access');
select * from finish();
rollback;
