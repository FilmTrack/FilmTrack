-- FilmTrack M3 Community Content foundation
-- Repository-only migration source. DO NOT apply to Production without explicit approval.
begin;

create table if not exists public.community_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id bigint not null,
  title_type text not null,
  body text not null,
  contains_spoilers boolean not null default false,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_reviews_title_type_check check (title_type in ('movie','tv')),
  constraint community_reviews_body_check check (char_length(body) between 1 and 4000),
  constraint community_reviews_visibility_check check (visibility in ('private','public')),
  unique (user_id,title_id,title_type)
);

create table if not exists public.community_review_likes (
  review_id uuid not null references public.community_reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id,user_id)
);

create table if not exists public.community_review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.community_reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_review_comments_body_check check (char_length(body) between 1 and 1000)
);

create table if not exists public.community_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_lists_slug_check check (slug = lower(slug) and slug ~ '^[a-z0-9-]{3,48}$'),
  constraint community_lists_name_check check (char_length(name) between 1 and 80),
  constraint community_lists_description_check check (description is null or char_length(description) <= 500),
  constraint community_lists_visibility_check check (visibility in ('private','public')),
  unique (user_id,slug)
);

create table if not exists public.community_list_items (
  list_id uuid not null references public.community_lists(id) on delete cascade,
  title_id bigint not null,
  title_type text not null,
  position integer not null default 0,
  note text,
  created_at timestamptz not null default now(),
  primary key (list_id,title_id,title_type),
  constraint community_list_items_title_type_check check (title_type in ('movie','tv')),
  constraint community_list_items_note_check check (note is null or char_length(note) <= 280)
);

create table if not exists public.community_activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  entity_id uuid,
  title_id bigint,
  title_type text,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  constraint community_activity_events_type_check check (event_type in ('review_created','review_liked','review_commented','list_created','list_updated')),
  constraint community_activity_events_title_type_check check (title_type is null or title_type in ('movie','tv')),
  constraint community_activity_events_visibility_check check (visibility in ('private','public'))
);

create index if not exists community_reviews_title_created_idx on public.community_reviews(title_type,title_id,created_at desc);
create index if not exists community_reviews_user_created_idx on public.community_reviews(user_id,created_at desc);
create index if not exists community_review_comments_review_created_idx on public.community_review_comments(review_id,created_at);
create index if not exists community_lists_user_created_idx on public.community_lists(user_id,created_at desc);
create index if not exists community_activity_user_created_idx on public.community_activity_events(user_id,created_at desc);
create index if not exists community_activity_public_created_idx on public.community_activity_events(visibility,created_at desc);

alter table public.community_reviews enable row level security;
alter table public.community_review_likes enable row level security;
alter table public.community_review_comments enable row level security;
alter table public.community_lists enable row level security;
alter table public.community_list_items enable row level security;
alter table public.community_activity_events enable row level security;

-- Reviews are readable by owners or when both review and author profile are public.
create policy "community_reviews_select_visible" on public.community_reviews for select to authenticated using (
  (select auth.uid()) = user_id or (
    visibility='public' and exists(select 1 from public.community_profiles p where p.user_id=community_reviews.user_id and p.visibility='public')
  )
);
create policy "community_reviews_insert_owner" on public.community_reviews for insert to authenticated with check ((select auth.uid())=user_id);
create policy "community_reviews_update_owner" on public.community_reviews for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "community_reviews_delete_owner" on public.community_reviews for delete to authenticated using ((select auth.uid())=user_id);

-- Likes/comments can only target reviews visible to the caller; writers own their interaction rows.
create policy "community_review_likes_select_visible" on public.community_review_likes for select to authenticated using (
  user_id=(select auth.uid()) or exists(select 1 from public.community_reviews r where r.id=review_id and (r.user_id=(select auth.uid()) or r.visibility='public'))
);
create policy "community_review_likes_insert_owner" on public.community_review_likes for insert to authenticated with check (user_id=(select auth.uid()) and exists(select 1 from public.community_reviews r where r.id=review_id and (r.user_id=(select auth.uid()) or r.visibility='public')));
create policy "community_review_likes_delete_owner" on public.community_review_likes for delete to authenticated using (user_id=(select auth.uid()));

create policy "community_review_comments_select_visible" on public.community_review_comments for select to authenticated using (
  user_id=(select auth.uid()) or exists(select 1 from public.community_reviews r where r.id=review_id and (r.user_id=(select auth.uid()) or r.visibility='public'))
);
create policy "community_review_comments_insert_owner" on public.community_review_comments for insert to authenticated with check (user_id=(select auth.uid()) and exists(select 1 from public.community_reviews r where r.id=review_id and (r.user_id=(select auth.uid()) or r.visibility='public')));
create policy "community_review_comments_update_owner" on public.community_review_comments for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "community_review_comments_delete_owner" on public.community_review_comments for delete to authenticated using (user_id=(select auth.uid()));

-- Lists/items inherit owner/public visibility from the list and author's public profile.
create policy "community_lists_select_visible" on public.community_lists for select to authenticated using (
  user_id=(select auth.uid()) or (visibility='public' and exists(select 1 from public.community_profiles p where p.user_id=community_lists.user_id and p.visibility='public'))
);
create policy "community_lists_insert_owner" on public.community_lists for insert to authenticated with check (user_id=(select auth.uid()));
create policy "community_lists_update_owner" on public.community_lists for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "community_lists_delete_owner" on public.community_lists for delete to authenticated using (user_id=(select auth.uid()));

create policy "community_list_items_select_visible" on public.community_list_items for select to authenticated using (exists(select 1 from public.community_lists l where l.id=list_id and (l.user_id=(select auth.uid()) or l.visibility='public')));
create policy "community_list_items_insert_owner" on public.community_list_items for insert to authenticated with check (exists(select 1 from public.community_lists l where l.id=list_id and l.user_id=(select auth.uid())));
create policy "community_list_items_update_owner" on public.community_list_items for update to authenticated using (exists(select 1 from public.community_lists l where l.id=list_id and l.user_id=(select auth.uid()))) with check (exists(select 1 from public.community_lists l where l.id=list_id and l.user_id=(select auth.uid())));
create policy "community_list_items_delete_owner" on public.community_list_items for delete to authenticated using (exists(select 1 from public.community_lists l where l.id=list_id and l.user_id=(select auth.uid())));

create policy "community_activity_select_visible" on public.community_activity_events for select to authenticated using (
  user_id=(select auth.uid()) or (visibility='public' and exists(select 1 from public.community_profiles p where p.user_id=community_activity_events.user_id and p.visibility='public'))
);
create policy "community_activity_insert_owner" on public.community_activity_events for insert to authenticated with check (user_id=(select auth.uid()));
create policy "community_activity_delete_owner" on public.community_activity_events for delete to authenticated using (user_id=(select auth.uid()));

revoke all privileges on table public.community_reviews,public.community_review_likes,public.community_review_comments,public.community_lists,public.community_list_items,public.community_activity_events from anon,authenticated;
grant select,insert,update,delete on public.community_reviews to authenticated;
grant select,insert,delete on public.community_review_likes to authenticated;
grant select,insert,update,delete on public.community_review_comments to authenticated;
grant select,insert,update,delete on public.community_lists to authenticated;
grant select,insert,update,delete on public.community_list_items to authenticated;
grant select,insert,delete on public.community_activity_events to authenticated;

commit;
