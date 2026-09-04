begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

select ok(to_regclass('public.community_episode_reviews') is not null, 'community_episode_reviews exists');
select ok(to_regclass('public.community_episode_review_comments') is not null, 'community_episode_review_comments exists');

select ok(
  exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='community_episode_reviews' and c.relrowsecurity
  ),
  'episode reviews has RLS enabled'
);

select ok(
  exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='community_episode_review_comments' and c.relrowsecurity
  ),
  'episode review comments has RLS enabled'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='community_episode_reviews'
      and policyname='community_episode_reviews_insert_watched_owner' and cmd='INSERT'
  ),
  'watched-owner insert policy exists'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='community_episode_reviews'
      and policyname='community_episode_reviews_select_visible' and cmd='SELECT'
  ),
  'visible review select policy exists'
);

select ok(
  exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='community_episode_review_comments'
      and policyname='community_episode_review_comments_insert_owner' and cmd='INSERT'
  ),
  'comment owner insert policy exists'
);

select ok(
  not has_table_privilege('anon','public.community_episode_reviews','SELECT'),
  'anon cannot read episode reviews'
);

select ok(
  not has_table_privilege('anon','public.community_episode_review_comments','SELECT'),
  'anon cannot read episode comments'
);

select ok(
  has_table_privilege('authenticated','public.community_episode_reviews','SELECT,INSERT,UPDATE,DELETE'),
  'authenticated review privileges are RLS-controlled'
);

select ok(
  has_table_privilege('authenticated','public.community_episode_review_comments','SELECT,INSERT,UPDATE,DELETE'),
  'authenticated comment privileges are RLS-controlled'
);

select ok(
  exists (
    select 1 from pg_constraint con
    join pg_class rel on rel.oid=con.conrelid
    join pg_namespace nsp on nsp.oid=rel.relnamespace
    where nsp.nspname='public' and rel.relname='community_episode_reviews'
      and con.conname='community_episode_reviews_content_check'
  ),
  'episode review requires rating or body'
);

select * from finish();
rollback;
