"use client";

import { createClient } from "@/lib/supabase/client";
import { isCommunityRuntimeEnabled } from "@/lib/m3/readiness";

export type CommunityFollowResult =
  | { ok: true; following: boolean }
  | { ok: false; code: "disabled" | "unauthenticated" | "self_follow" | "profile_not_found" | "database_error"; message: string };

export type CommunityRelationshipResult =
  | { ok: true; following: boolean; followsYou: boolean }
  | { ok: false; code: "disabled" | "unauthenticated" | "profile_not_found" | "database_error" };

async function resolveCommunityTarget(targetUsername: string) {
  const username = targetUsername.trim().toLowerCase();
  if (!username) return null;

  const supabase = createClient();
  const { data: target, error } = await supabase
    .from("community_profiles")
    .select("user_id,username,visibility")
    .eq("username", username)
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !target) return null;
  return { supabase, target };
}

export async function getCommunityRelationship(
  targetUsername: string,
): Promise<CommunityRelationshipResult> {
  if (!isCommunityRuntimeEnabled()) return { ok: false, code: "disabled" };

  const resolved = await resolveCommunityTarget(targetUsername);
  if (!resolved) return { ok: false, code: "profile_not_found" };

  const { supabase, target } = resolved;
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, code: "unauthenticated" };
  if (target.user_id === user.id) {
    return { ok: true, following: false, followsYou: false };
  }

  // Both reads remain participant-scoped under M3 RLS: the viewer is the
  // follower in the forward edge and the followed participant in the reverse.
  const [{ data: forwardEdge, error: forwardError }, { data: reverseEdge, error: reverseError }] =
    await Promise.all([
      supabase
        .from("community_follows")
        .select("followed_user_id")
        .eq("follower_user_id", user.id)
        .eq("followed_user_id", target.user_id)
        .maybeSingle(),
      supabase
        .from("community_follows")
        .select("follower_user_id")
        .eq("follower_user_id", target.user_id)
        .eq("followed_user_id", user.id)
        .maybeSingle(),
    ]);

  if (forwardError || reverseError) return { ok: false, code: "database_error" };
  return {
    ok: true,
    following: Boolean(forwardEdge),
    followsYou: Boolean(reverseEdge),
  };
}

export async function setCommunityFollow(
  targetUsername: string,
  shouldFollow: boolean,
): Promise<CommunityFollowResult> {
  if (!isCommunityRuntimeEnabled()) {
    return { ok: false, code: "disabled", message: "Community runtime is not enabled." };
  }

  const resolved = await resolveCommunityTarget(targetUsername);
  if (!resolved) {
    return { ok: false, code: "profile_not_found", message: "Community profile was not found." };
  }

  const { supabase, target } = resolved;
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, code: "unauthenticated", message: "Sign in to follow FilmTrack members." };
  }

  if (target.user_id === user.id) {
    return { ok: false, code: "self_follow", message: "You cannot follow your own profile." };
  }

  if (shouldFollow) {
    const { error } = await supabase
      .from("community_follows")
      .upsert(
        { follower_user_id: user.id, followed_user_id: target.user_id },
        { onConflict: "follower_user_id,followed_user_id", ignoreDuplicates: true },
      );

    if (error) {
      return { ok: false, code: "database_error", message: "Follow could not be saved." };
    }

    return { ok: true, following: true };
  }

  const { error } = await supabase
    .from("community_follows")
    .delete()
    .eq("follower_user_id", user.id)
    .eq("followed_user_id", target.user_id);

  if (error) {
    return { ok: false, code: "database_error", message: "Unfollow could not be saved." };
  }

  return { ok: true, following: false };
}
