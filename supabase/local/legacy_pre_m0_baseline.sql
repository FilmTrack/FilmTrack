-- Local/CI-only legacy baseline for replaying FilmTrack migrations from scratch.
-- This file is NEVER pushed to a remote database and is not part of migration history.
-- CI copies it to a temporary earlier migration filename inside the ephemeral runner.

begin;

create table if not exists public.user_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id integer not null,
  title_type varchar not null,
  status varchar default 'plan_to_watch',
  created_at timestamptz default now(),
  constraint user_lists_user_id_title_id_key unique (user_id, title_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  title_id integer not null,
  title_type varchar not null,
  content text not null,
  is_spoiler boolean default false,
  created_at timestamptz default now()
);

alter table public.user_lists enable row level security;
alter table public.comments enable row level security;

commit;
