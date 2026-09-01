"use client";

import { createClient } from "@/lib/supabase/client";
import { isCommunityRuntimeEnabled } from "@/lib/m3/readiness";

export type CommunityFollowResult =
  | { ok: true; following: boolean }
  | { ok: false; code: "disabled" | "unauthenticated" | "self_follow" | "profile_not_found" | "database_error"; message: string };

export async function setCommunityFollow(
  targetUsername: string,
  shouldFollow: boolean,
): Promise<CommunityFollowResult> {
  if (!isCommunityRuntimeEnabled()) {
    return { ok: false, code: "disabled", message: "Community runtime is not enabled." };
  }

  const username = targetUsername.trim().toLowerCase();
  if (!username) {
    return { ok: false, code: "profile_not_found", message: "Community profile was not found." };
  }

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, code: "unauthenticated", message: "Sign in to follow FilmTrack members." };
  }

  const { data: target, error: targetError } = await supabase
    .from("community_profiles")
    .select("user_id,username,visibility")
    .eq("username", username)
    .maybeSingle();

  if (targetError || !target) {
    return { ok: false, code: "profile_not_found", message: "Community profile was not found." };
  }

  if (target.user_id === user.id) {
    return { ok: false, code: "self_follow", message: "You cannot follow your own profile." };
  }

  if (shouldFollow) {
    const { error } = await supabase
      .from("community_follows")
      .upsert(
        { follower_id: user.id, following_id: target.user_id },
        { onConflict: "follower_id,following_id", ignoreDuplicates: true },
      );

    if (error) {
      return { ok: false, code: "database_error", message: "Follow could not be saved." };
    }

    return { ok: true, following: true };
  }

  const { error } = await supabase
    .from("community_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", target.user_id);

  if (error) {
    return { ok: false, code: "database_error", message: "Unfollow could not be saved." };
  }

  return { ok: true, following: false };
}
