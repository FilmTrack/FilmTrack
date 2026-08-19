-- FilmTrack M0-A data-boundary foundation
-- Audited against production on 2026-08-19.
--
-- IMPORTANT:
--   This file is version-controlled migration source.
--   The bootstrap script that creates this file does NOT apply it remotely.
--
-- Pre-audit facts:
--   public.user_lists rows = 5
--   public.comments rows = 0
--   invalid title_type rows = 0
--   duplicate canonical user_list groups = 0
--
-- Goals:
--   1. Canonical media identity includes title_type.
--   2. Public comments never persist email identity.
--   3. RLS owner policies target authenticated explicitly.
--   4. Policy columns have supporting indexes.
--   5. anon/authenticated table grants follow least privilege.

begin;

-- Abort instead of silently coercing unexpected production data.
do $$
begin
  if exists (
    select 1
    from public.user_lists
    where title_type not in ('movie', 'tv')
  ) then
    raise exception 'M0-A abort: invalid user_lists.title_type exists';
  end if;

  if exists (
    select 1
    from public.comments
    where title_type not in ('movie', 'tv')
  ) then
    raise exception 'M0-A abort: invalid comments.title_type exists';
  end if;

  if exists (
    select 1
    from public.user_lists
    where status is null
       or status not in (
         'plan_to_watch',
         'watching',
         'completed',
         'on_hold',
         'dropped'
       )
  ) then
    raise exception 'M0-A abort: invalid user_lists.status exists';
  end if;

  if exists (
    select 1
    from public.user_lists
    group by user_id, title_id, title_type
    having count(*) > 1
  ) then
    raise exception 'M0-A abort: duplicate canonical user_list identity exists';
  end if;
end
$$;

-- Canonical movie/TV identity.
alter table public.user_lists
  drop constraint if exists user_lists_user_id_title_id_key;

alter table public.user_lists
  add constraint user_lists_user_id_title_id_title_type_key
  unique (user_id, title_id, title_type);

-- Database-level domain guards.
alter table public.user_lists
  add constraint user_lists_title_type_check
  check (title_type in ('movie', 'tv'));

alter table public.user_lists
  add constraint user_lists_status_check
  check (
    status in (
      'plan_to_watch',
      'watching',
      'completed',
      'on_hold',
      'dropped'
    )
  );

alter table public.user_lists
  alter column status set not null;

alter table public.comments
  add constraint comments_title_type_check
  check (title_type in ('movie', 'tv'));

-- Raw email is not public comment identity.
alter table public.comments
  drop column if exists user_email;

-- Indexes that match RLS and title-scoped reads.
create index if not exists
  user_lists_user_id_created_at_idx
  on public.user_lists (user_id, created_at desc);

create index if not exists
  comments_user_id_idx
  on public.comments (user_id);

create index if not exists
  comments_title_identity_created_at_idx
  on public.comments (title_id, title_type, created_at desc);

-- Rebuild user_lists policies with explicit authenticated role.
drop policy if exists "Users can view their own list"
  on public.user_lists;
drop policy if exists "Users can insert their own list"
  on public.user_lists;
drop policy if exists "Users can update their own list"
  on public.user_lists;
drop policy if exists "Users can delete their own list"
  on public.user_lists;

create policy "Users can view their own list"
  on public.user_lists
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own list"
  on public.user_lists
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own list"
  on public.user_lists
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own list"
  on public.user_lists
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Public comments stay publicly readable, but writes require auth.
drop policy if exists "Anyone can view comments"
  on public.comments;
drop policy if exists "Users can insert their own comments"
  on public.comments;

create policy "Anyone can view comments"
  on public.comments
  for select
  to anon, authenticated
  using (true);

create policy "Users can insert their own comments"
  on public.comments
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Least-privilege grants.
revoke all privileges
  on table public.comments
  from anon, authenticated;

revoke all privileges
  on table public.user_lists
  from anon, authenticated;

grant select
  on table public.comments
  to anon;

grant select, insert
  on table public.comments
  to authenticated;

grant select, insert, update, delete
  on table public.user_lists
  to authenticated;

commit;
