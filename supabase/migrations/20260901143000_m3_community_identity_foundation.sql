-- FilmTrack M3 Community Identity foundation
-- Repository-only migration source. DO NOT apply to production without explicit approval.
--
-- Goals:
--   1. Public identity never depends on auth email.
--   2. Profiles are private by default.
--   3. Username identity is normalized and unique.
--   4. Follow relationships are owner-controlled and duplicate-safe.
--   5. RLS enforces profile visibility and follow privacy boundaries.

begin;

create table if not exists public.community_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text,
  bio text,
  avatar_url text,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_profiles_username_format_check
    check (username = lower(username) and username ~ '^[a-z0-9_]{3,30}$'),
  constraint community_profiles_display_name_length_check
    check (display_name is null or char_length(display_name) between 1 and 80),
  constraint community_profiles_bio_length_check
    check (bio is null or char_length(bio) <= 280),
  constraint community_profiles_avatar_url_length_check
    check (avatar_url is null or char_length(avatar_url) <= 1000),
  constraint community_profiles_visibility_check
    check (visibility in ('private', 'public'))
);

create unique index if not exists community_profiles_username_unique_idx
  on public.community_profiles (lower(username));

create index if not exists community_profiles_visibility_username_idx
  on public.community_profiles (visibility, username);

create table if not exists public.community_follows (
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  followed_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_user_id, followed_user_id),
  constraint community_follows_no_self_follow_check
    check (follower_user_id <> followed_user_id)
);

create index if not exists community_follows_followed_created_idx
  on public.community_follows (followed_user_id, created_at desc);

create index if not exists community_follows_follower_created_idx
  on public.community_follows (follower_user_id, created_at desc);

alter table public.community_profiles enable row level security;
alter table public.community_follows enable row level security;

-- Profiles: owners can always read their own profile. Other users can only read
-- profiles explicitly marked public. Anonymous reads are intentionally disabled
-- at this foundation stage until public profile routing/moderation is ready.
drop policy if exists "community_profiles_select_authenticated" on public.community_profiles;
create policy "community_profiles_select_authenticated"
  on public.community_profiles
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or visibility = 'public'
  );

drop policy if exists "community_profiles_insert_owner" on public.community_profiles;
create policy "community_profiles_insert_owner"
  on public.community_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "community_profiles_update_owner" on public.community_profiles;
create policy "community_profiles_update_owner"
  on public.community_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "community_profiles_delete_owner" on public.community_profiles;
create policy "community_profiles_delete_owner"
  on public.community_profiles
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Follow graph: a user can manage only their outgoing follow edges. Reads are
-- limited to edges where the caller participates, preventing broad graph export.
drop policy if exists "community_follows_select_participant" on public.community_follows;
create policy "community_follows_select_participant"
  on public.community_follows
  for select
  to authenticated
  using (
    (select auth.uid()) = follower_user_id
    or (select auth.uid()) = followed_user_id
  );

drop policy if exists "community_follows_insert_follower" on public.community_follows;
create policy "community_follows_insert_follower"
  on public.community_follows
  for insert
  to authenticated
  with check ((select auth.uid()) = follower_user_id);

drop policy if exists "community_follows_delete_follower" on public.community_follows;
create policy "community_follows_delete_follower"
  on public.community_follows
  for delete
  to authenticated
  using ((select auth.uid()) = follower_user_id);

revoke all privileges on table public.community_profiles from anon, authenticated;
revoke all privileges on table public.community_follows from anon, authenticated;

grant select, insert, update, delete
  on table public.community_profiles
  to authenticated;

grant select, insert, delete
  on table public.community_follows
  to authenticated;

commit;
