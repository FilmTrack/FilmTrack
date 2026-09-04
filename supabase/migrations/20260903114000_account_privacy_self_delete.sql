-- FilmTrack Account & Privacy self-delete foundation
-- Repository-only migration source. DO NOT apply to Production without explicit approval.
--
-- Security goals:
--   1. Only an authenticated user can invoke deletion.
--   2. The caller can delete only auth.uid(); no user id parameter is accepted.
--   3. SECURITY DEFINER uses an empty/fixed search_path and fully-qualified names.
--   4. FilmTrack-owned rows are removed before the auth identity.
--   5. anon/public cannot execute the function.

begin;

create or replace function public.delete_my_filmtrack_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  -- Community content children first.
  delete from public.community_review_likes where user_id = caller_id;
  delete from public.community_review_comments where user_id = caller_id;
  delete from public.community_list_items
    where list_id in (select id from public.community_lists where user_id = caller_id);
  delete from public.community_activity_events where user_id = caller_id;
  delete from public.community_lists where user_id = caller_id;
  delete from public.community_reviews where user_id = caller_id;

  -- Community graph / identity.
  delete from public.community_follows
    where follower_user_id = caller_id or followed_user_id = caller_id;
  delete from public.community_profiles where user_id = caller_id;

  -- Personal tracking/content.
  delete from public.episode_progress where user_id = caller_id;
  delete from public.diary_entries where user_id = caller_id;
  delete from public.user_ratings where user_id = caller_id;
  delete from public.comments where user_id = caller_id;
  delete from public.user_lists where user_id = caller_id;

  -- Deleting auth identity last invalidates future sessions and preserves
  -- referential integrity for any remaining ON DELETE CASCADE dependants.
  delete from auth.users where id = caller_id;

  if found is false then
    raise exception 'Account deletion failed';
  end if;
end;
$$;

revoke all on function public.delete_my_filmtrack_account() from public;
revoke all on function public.delete_my_filmtrack_account() from anon;
grant execute on function public.delete_my_filmtrack_account() to authenticated;

commit;
