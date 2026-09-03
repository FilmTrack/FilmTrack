-- FilmTrack P0 Episode Community + Spoiler Protection foundation
-- Repository-only migration source. DO NOT apply to Production without explicit approval.
begin;

create table if not exists public.community_episode_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id integer not null check (title_id > 0),
  season_number integer not null check (season_number >= 0),
  episode_number integer not null check (episode_number > 0),
  rating smallint,
  body text,
  contains_spoilers boolean not null default true,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_episode_reviews_rating_check check (rating is null or rating between 1 and 10),
  constraint community_episode_reviews_body_check check (body is null or char_length(body) between 1 and 3000),
  constraint community_episode_reviews_content_check check (rating is not null or body is not null),
  constraint community_episode_reviews_visibility_check check (visibility in ('private','public')),
  unique (user_id,title_id,season_number,episode_number)
);

create table if not exists public.community_episode_review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.community_episode_reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_episode_review_comments_body_check check (char_length(body) between 1 and 1000)
);

create index if not exists community_episode_reviews_episode_idx
  on public.community_episode_reviews(title_id,season_number,episode_number,created_at desc);
create index if not exists community_episode_reviews_user_idx
  on public.community_episode_reviews(user_id,created_at desc);
create index if not exists community_episode_review_comments_review_idx
  on public.community_episode_review_comments(review_id,created_at);

alter table public.community_episode_reviews enable row level security;
alter table public.community_episode_review_comments enable row level security;

-- Owners can always read their own review. Other authenticated users can read only
-- public reviews from public profiles. Runtime spoiler protection adds the user's
-- watched-boundary gate before these rows are queried/rendered.
create policy "community_episode_reviews_select_visible"
  on public.community_episode_reviews
  for select to authenticated
  using (
    user_id=(select auth.uid()) or (
      visibility='public' and exists(
        select 1 from public.community_profiles p
        where p.user_id=community_episode_reviews.user_id and p.visibility='public'
      )
    )
  );

-- A user may rate/review only an episode they have marked watched.
create policy "community_episode_reviews_insert_watched_owner"
  on public.community_episode_reviews
  for insert to authenticated
  with check (
    user_id=(select auth.uid()) and exists(
      select 1 from public.episode_progress ep
      where ep.user_id=(select auth.uid())
        and ep.title_id=community_episode_reviews.title_id
        and ep.season_number=community_episode_reviews.season_number
        and ep.episode_number=community_episode_reviews.episode_number
    )
  );

create policy "community_episode_reviews_update_watched_owner"
  on public.community_episode_reviews
  for update to authenticated
  using (user_id=(select auth.uid()))
  with check (
    user_id=(select auth.uid()) and exists(
      select 1 from public.episode_progress ep
      where ep.user_id=(select auth.uid())
        and ep.title_id=community_episode_reviews.title_id
        and ep.season_number=community_episode_reviews.season_number
        and ep.episode_number=community_episode_reviews.episode_number
    )
  );

create policy "community_episode_reviews_delete_owner"
  on public.community_episode_reviews
  for delete to authenticated
  using (user_id=(select auth.uid()));

create policy "community_episode_review_comments_select_visible"
  on public.community_episode_review_comments
  for select to authenticated
  using (
    user_id=(select auth.uid()) or exists(
      select 1 from public.community_episode_reviews r
      where r.id=review_id and (r.user_id=(select auth.uid()) or r.visibility='public')
    )
  );

create policy "community_episode_review_comments_insert_owner"
  on public.community_episode_review_comments
  for insert to authenticated
  with check (
    user_id=(select auth.uid()) and exists(
      select 1 from public.community_episode_reviews r
      where r.id=review_id and (r.user_id=(select auth.uid()) or r.visibility='public')
    )
  );

create policy "community_episode_review_comments_update_owner"
  on public.community_episode_review_comments
  for update to authenticated
  using (user_id=(select auth.uid()))
  with check (user_id=(select auth.uid()));

create policy "community_episode_review_comments_delete_owner"
  on public.community_episode_review_comments
  for delete to authenticated
  using (user_id=(select auth.uid()));

revoke all privileges on table public.community_episode_reviews,public.community_episode_review_comments from anon,authenticated;
grant select,insert,update,delete on public.community_episode_reviews to authenticated;
grant select,insert,update,delete on public.community_episode_review_comments to authenticated;

comment on table public.community_episode_reviews is
  'Episode-level ratings/reviews. Writers must have matching private episode_progress; Production rollout requires explicit migration and feature-flag approval.';
comment on table public.community_episode_review_comments is
  'Authenticated discussion rows attached to spoiler-safe episode reviews.';

commit;
