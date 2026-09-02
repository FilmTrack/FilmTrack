begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

-- Local-only identities. The test transaction is rolled back at the end.
insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-0000-0000-0000000000a1', 'a@local.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b2', 'b@local.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c3', 'c@local.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000d4', 'd@local.test', 'authenticated', 'authenticated');

insert into public.community_profiles (user_id, username, display_name, visibility)
values
  ('00000000-0000-0000-0000-0000000000a1', 'local_a', 'Local A', 'private'),
  ('00000000-0000-0000-0000-0000000000b2', 'local_b', 'Local B', 'public'),
  ('00000000-0000-0000-0000-0000000000c3', 'local_c', 'Local C', 'public'),
  ('00000000-0000-0000-0000-0000000000d4', 'local_d', 'Local D', 'private');

insert into public.community_follows (follower_user_id, followed_user_id)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b2'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000c3'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000d4');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

select is(
  (select count(*)::integer from public.community_profiles),
  3,
  'viewer sees own private profile plus explicit public profiles only'
);

select ok(
  exists (select 1 from public.community_profiles where username = 'local_a'),
  'viewer can read own private profile'
);

select ok(
  not exists (select 1 from public.community_profiles where username = 'local_d'),
  'viewer cannot read another private profile'
);

select ok(
  exists (select 1 from public.community_profiles where username = 'local_b'),
  'viewer can read an explicitly public profile'
);

select is(
  (select count(*)::integer from public.community_follows),
  1,
  'viewer only sees follow edges where they participate'
);

select ok(
  exists (
    select 1 from public.community_follows
    where follower_user_id = '00000000-0000-0000-0000-0000000000a1'
      and followed_user_id = '00000000-0000-0000-0000-0000000000b2'
  ),
  'viewer sees own outgoing follow edge'
);

select ok(
  not exists (
    select 1 from public.community_follows
    where follower_user_id = '00000000-0000-0000-0000-0000000000b2'
      and followed_user_id = '00000000-0000-0000-0000-0000000000c3'
  ),
  'viewer cannot enumerate unrelated follow edges'
);

reset role;
select * from finish();
rollback;
