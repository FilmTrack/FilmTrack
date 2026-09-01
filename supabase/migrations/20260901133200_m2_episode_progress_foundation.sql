-- FilmTrack M2 episode progress foundation
-- Source-only migration. Do not apply to production without a separate explicit approval.

create table if not exists public.episode_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id integer not null check (title_id > 0),
  season_number integer not null check (season_number >= 0),
  episode_number integer not null check (episode_number > 0),
  watched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint episode_progress_user_episode_unique
    unique (user_id, title_id, season_number, episode_number)
);

create index if not exists episode_progress_user_recent_idx
  on public.episode_progress (user_id, watched_at desc);

create index if not exists episode_progress_user_title_idx
  on public.episode_progress (user_id, title_id, season_number, episode_number);

alter table public.episode_progress enable row level security;

revoke all on public.episode_progress from anon;
revoke all on public.episode_progress from authenticated;

grant select, insert, update, delete on public.episode_progress to authenticated;

drop policy if exists "episode_progress_select_own" on public.episode_progress;
create policy "episode_progress_select_own"
  on public.episode_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "episode_progress_insert_own" on public.episode_progress;
create policy "episode_progress_insert_own"
  on public.episode_progress
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "episode_progress_update_own" on public.episode_progress;
create policy "episode_progress_update_own"
  on public.episode_progress
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "episode_progress_delete_own" on public.episode_progress;
create policy "episode_progress_delete_own"
  on public.episode_progress
  for delete
  to authenticated
  using (auth.uid() = user_id);

comment on table public.episode_progress is
  'Private per-user episode watch state for FilmTrack M2. Production rollout requires an explicit migration gate.';
