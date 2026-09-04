"use client";

import { createClient } from "@/lib/supabase/client";
import { isAccountDeleteRuntimeEnabled } from "@/lib/account/readiness";

async function requireUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
}

async function selectOwnRows(
  supabase: ReturnType<typeof createClient>,
  table: string,
  userId: string,
) {
  const { data, error } = await supabase.from(table).select("*").eq("user_id", userId);
  if (error) {
    // Newer feature tables may not exist until their separately approved
    // migration is applied. Treat only relation-not-found as an empty section.
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }
  return data ?? [];
}

export async function exportMyFilmTrackData() {
  const auth = await requireUser();
  if (!auth) return { ok: false as const, code: "unauthenticated" as const };
  const { supabase, user } = auth;

  try {
    const [
      userLists,
      comments,
      ratings,
      diaryEntries,
      episodeProgress,
      communityProfiles,
      communityReviews,
      communityReviewLikes,
      communityReviewComments,
      communityLists,
      communityActivity,
    ] = await Promise.all([
      selectOwnRows(supabase, "user_lists", user.id),
      selectOwnRows(supabase, "comments", user.id),
      selectOwnRows(supabase, "user_ratings", user.id),
      selectOwnRows(supabase, "diary_entries", user.id),
      selectOwnRows(supabase, "episode_progress", user.id),
      selectOwnRows(supabase, "community_profiles", user.id),
      selectOwnRows(supabase, "community_reviews", user.id),
      selectOwnRows(supabase, "community_review_likes", user.id),
      selectOwnRows(supabase, "community_review_comments", user.id),
      selectOwnRows(supabase, "community_lists", user.id),
      selectOwnRows(supabase, "community_activity_events", user.id),
    ]);

    const listIds = communityLists
      .map((row) => (row as { id?: string }).id)
      .filter((id): id is string => Boolean(id));

    let communityListItems: unknown[] = [];
    if (listIds.length > 0) {
      const { data, error } = await supabase
        .from("community_list_items")
        .select("*")
        .in("list_id", listIds);
      if (error && error.code !== "42P01" && error.code !== "PGRST205") throw error;
      communityListItems = data ?? [];
    }

    const payload = {
      format: "filmtrack-user-export-v1",
      exported_at: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email ?? null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
      },
      data: {
        user_lists: userLists,
        comments,
        user_ratings: ratings,
        diary_entries: diaryEntries,
        episode_progress: episodeProgress,
        community_profiles: communityProfiles,
        community_reviews: communityReviews,
        community_review_likes: communityReviewLikes,
        community_review_comments: communityReviewComments,
        community_lists: communityLists,
        community_list_items: communityListItems,
        community_activity_events: communityActivity,
      },
    };

    return { ok: true as const, payload };
  } catch {
    return { ok: false as const, code: "database_error" as const };
  }
}

export async function deleteMyFilmTrackAccount() {
  if (!isAccountDeleteRuntimeEnabled()) {
    return { ok: false as const, code: "disabled" as const };
  }

  const auth = await requireUser();
  if (!auth) return { ok: false as const, code: "unauthenticated" as const };

  const { error } = await auth.supabase.rpc("delete_my_filmtrack_account");
  if (error) return { ok: false as const, code: "database_error" as const };

  await auth.supabase.auth.signOut();
  return { ok: true as const };
}
