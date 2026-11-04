begin;
select plan(15);
insert into auth.users (id,email) values
 ('30000000-0000-0000-0000-000000000001','gallery-admin@example.test'),
 ('30000000-0000-0000-0000-000000000002','gallery-member@example.test'),
 ('30000000-0000-0000-0000-000000000003','gallery-pending@example.test');
update public.profiles set role='admin', must_change_password=false where id='30000000-0000-0000-0000-000000000001';
update public.profiles set must_change_password=false where id='30000000-0000-0000-0000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000001',true);
select lives_ok($$insert into public.albums(id,title,created_by) values ('40000000-0000-4000-8000-000000000001','Album','30000000-0000-0000-0000-000000000001')$$,'admin creates album');
select lives_ok($$insert into storage.objects(bucket_id,name) values ('ghepardi-gallery','40000000-0000-4000-8000-000000000001/50000000-0000-4000-8000-000000000001.jpg')$$,'admin uploads object');
select lives_ok($$insert into public.photos(id,album_id,storage_path,created_by) values ('50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001/50000000-0000-4000-8000-000000000001.jpg','30000000-0000-0000-0000-000000000001')$$,'admin records photo');
select lives_ok($$insert into public.posts(id,author_id,title,slug,content,category,status,cover_photo_id) values ('60000000-0000-4000-8000-000000000001','30000000-0000-0000-0000-000000000001','Post','gallery-test','test','news','published','50000000-0000-4000-8000-000000000001')$$,'admin attaches a cover');
select throws_ok($$delete from public.albums where id='40000000-0000-4000-8000-000000000001'$$,'23503',null,'nonempty album cannot be deleted');
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000002',true);
select is((select count(*) from public.albums where id='40000000-0000-4000-8000-000000000001'),1::bigint,'member reads album');
select is((select count(*) from public.photos where id='50000000-0000-4000-8000-000000000001'),1::bigint,'member reads photo');
select is((select count(*) from storage.objects where bucket_id='ghepardi-gallery' and name='40000000-0000-4000-8000-000000000001/50000000-0000-4000-8000-000000000001.jpg'),1::bigint,'member reads associated object');
select throws_ok($$insert into storage.objects(bucket_id,name) values ('ghepardi-gallery','other.jpg')$$,'42501',null,'member cannot upload');
select results_eq($$delete from public.photos where id='50000000-0000-4000-8000-000000000001' returning 1$$,$$select 1 where false$$,'member cannot delete photo');
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000003',true);
select is((select count(*) from public.photos),0::bigint,'member with temporary password cannot read photos');
select is((select count(*) from storage.objects where bucket_id='ghepardi-gallery'),0::bigint,'member with temporary password cannot read objects');
select set_config('request.jwt.claim.sub','30000000-0000-0000-0000-000000000001',true);
select lives_ok($$delete from public.photos where id='50000000-0000-4000-8000-000000000001'$$,'admin can remove photo metadata');
select ok((select cover_photo_id is null from public.posts where id='60000000-0000-4000-8000-000000000001'),'deleted photo is removed from post');
reset role;
set local role anon;
select throws_ok('select * from public.photos','42501',null,'anonymous cannot read photos');
select * from finish();
rollback;
