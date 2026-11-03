begin;
select plan(17);
insert into auth.users (id, email) values
 ('10000000-0000-0000-0000-000000000001','editor@example.test'),
 ('10000000-0000-0000-0000-000000000002','member@example.test'),
 ('10000000-0000-0000-0000-000000000003','pending@example.test');
update public.profiles set role = 'admin', must_change_password = false where id = '10000000-0000-0000-0000-000000000001';
update public.profiles set must_change_password = false where id = '10000000-0000-0000-0000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
select lives_ok($$insert into public.posts(id,author_id,title,slug,content,category,status) values ('20000000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000001','Bozza','bozza','Contenuto','news','draft')$$,'admin can create draft');
select lives_ok($$insert into public.posts(id,author_id,title,slug,content,category,status) values ('20000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000001','Pubblicato','pubblicato','Contenuto','news','published')$$,'admin can publish');
select ok((select published_at is not null from public.posts where slug='pubblicato'),'publication date is assigned');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
select is((select count(*) from public.posts),1::bigint,'member sees only published posts');
select throws_ok($$insert into public.posts(id,author_id,title,slug,content,category,status) values ('20000000-0000-4000-8000-000000000003','10000000-0000-0000-0000-000000000002','No','no','No','news','published')$$,'42501',null,'member cannot publish');
select lives_ok($$insert into public.comments(post_id,user_id,content) values ('20000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000002','Ciao')$$,'member comments on published post');
select throws_ok($$insert into public.comments(post_id,user_id,content) values ('20000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000001','Falso')$$,'42501',null,'cannot impersonate another member');
select throws_ok($$insert into public.comments(post_id,user_id,content) values ('20000000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000002','Bozza')$$,'42501',null,'cannot comment on drafts');
select lives_ok($$insert into public.post_reactions(post_id,user_id,emoji) values ('20000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000002','🔥')$$,'member reacts');
select throws_ok($$insert into public.post_reactions(post_id,user_id,emoji) values ('20000000-0000-4000-8000-000000000002','10000000-0000-0000-0000-000000000002','🔥')$$,'23505',null,'same reaction cannot be repeated');
select throws_ok($$insert into public.post_reactions(post_id,user_id,emoji) values ('20000000-0000-4000-8000-000000000001','10000000-0000-0000-0000-000000000002','🔥')$$,'42501',null,'cannot react to draft');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
select is((select count(*) from public.posts),0::bigint,'pending password change cannot read posts');
select is((select count(*) from public.comments),0::bigint,'pending password change cannot read comments');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
select is((select count(*) from public.posts),2::bigint,'admin can read drafts');
select lives_ok($$update public.posts set status='draft' where slug='pubblicato'$$,'admin can unpublish');
select ok((select published_at is null from public.posts where slug='pubblicato'),'draft has no publication date');
reset role;
set local role anon;
select throws_ok('select * from public.posts','42501',null,'anonymous cannot read posts');
select * from finish();
rollback;
