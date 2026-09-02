begin;

create extension if not exists pgtap with schema extensions;
select plan(16);

select ok(to_regclass('public.community_profiles') is not null, 'community_profiles exists');
select ok(to_regclass('public.community_follows') is not null, 'community_follows exists');

select ok(
  exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'community_profiles' and c.relrowsecurity
  ),
  'community_profiles has RLS enabled'
);

select ok(
  exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'community_follows' and c.relrowsecurity
  ),
  'community_follows has RLS enabled'
);

select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'community_follows' and column_name = 'follower_user_id'
  ),
  'canonical follower_user_id column exists'
);

select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'community_follows' and column_name = 'followed_user_id'
  ),
  'canonical followed_user_id column exists'
);

select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'community_follows' and column_name in ('follower_id', 'following_id')
  ),
  'legacy follow column names are absent'
);

select ok(
  exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'community_follows'
      and con.contype = 'p'
      and pg_get_constraintdef(con.oid) like '%follower_user_id%followed_user_id%'
  ),
  'follow primary key uses canonical pair'
);

select ok(
  exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'community_follows'
      and con.conname = 'community_follows_no_self_follow_check'
  ),
  'self-follow constraint exists'
);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'community_profiles'
      and column_name = 'visibility'
      and column_default like '%private%'
  ),
  'profile visibility defaults private'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_profiles'
      and policyname = 'community_profiles_select_authenticated'
      and cmd = 'SELECT'
  ),
  'authenticated profile select policy exists'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_follows'
      and policyname = 'community_follows_select_participant'
      and cmd = 'SELECT'
  ),
  'participant-scoped follow select policy exists'
);

select ok(
  not has_table_privilege('anon', 'public.community_profiles', 'SELECT'),
  'anon cannot select community profiles'
);

select ok(
  not has_table_privilege('anon', 'public.community_follows', 'SELECT'),
  'anon cannot select community follows'
);

select ok(
  has_table_privilege('authenticated', 'public.community_profiles', 'SELECT,INSERT,UPDATE,DELETE'),
  'authenticated profile privileges are present and RLS-controlled'
);

select ok(
  has_table_privilege('authenticated', 'public.community_follows', 'SELECT,INSERT,DELETE'),
  'authenticated follow privileges are present and RLS-controlled'
);

select * from finish();
rollback;
