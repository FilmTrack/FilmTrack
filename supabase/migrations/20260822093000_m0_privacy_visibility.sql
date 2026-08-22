-- FilmTrack M0 privacy visibility foundation
-- Default-private rollout: existing and new list rows remain private unless the owner opts in.

begin;

alter table public.user_lists
  add column if not exists is_public boolean not null default false;

create index if not exists
  user_lists_public_profile_idx
  on public.user_lists (user_id, created_at desc)
  where is_public = true;

-- Owner keeps full access. Public/anonymous reads are limited to rows explicitly opted in.
drop policy if exists "Anyone can view public list items"
  on public.user_lists;

create policy "Anyone can view public list items"
  on public.user_lists
  for select
  to anon, authenticated
  using (is_public = true);

-- Existing owner policy remains in place and combines permissively with the public policy.
grant select
  on table public.user_lists
  to anon;

commit;
