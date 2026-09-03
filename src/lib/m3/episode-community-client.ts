"use client";

import { createClient } from "@/lib/supabase/client";
import { isEpisodeCommunityRuntimeEnabled } from "@/lib/m3/episode-community-readiness";

type Visibility = "private" | "public";

async function currentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
}

export async function saveEpisodeReview(input: {
  titleId: number;
  seasonNumber: number;
  episodeNumber: number;
  rating?: number | null;
  body?: string;
  containsSpoilers?: boolean;
  visibility?: Visibility;
}) {
  if (!isEpisodeCommunityRuntimeEnabled()) return { ok: false as const, code: "disabled" as const };
  const auth = await currentUser();
  if (!auth) return { ok: false as const, code: "unauthenticated" as const };

  const body = input.body?.trim() || null;
  const rating = input.rating == null ? null : Math.round(input.rating);
  if ((rating == null && !body) || (rating != null && (rating < 1 || rating > 10)) || (body && body.length > 3000)) {
    return { ok: false as const, code: "invalid" as const };
  }

  const { data, error } = await auth.supabase
    .from("community_episode_reviews")
    .upsert({
      user_id: auth.user.id,
      title_id: input.titleId,
      season_number: input.seasonNumber,
      episode_number: input.episodeNumber,
      rating,
      body,
      contains_spoilers: input.containsSpoilers ?? true,
      visibility: input.visibility ?? "private",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,title_id,season_number,episode_number" })
    .select("id")
    .single();

  if (error) return { ok: false as const, code: "database_error" as const };
  return { ok: true as const, reviewId: data.id };
}

export async function addEpisodeReviewComment(reviewId: string, bodyInput: string) {
  if (!isEpisodeCommunityRuntimeEnabled()) return { ok: false as const, code: "disabled" as const };
  const auth = await currentUser();
  if (!auth) return { ok: false as const, code: "unauthenticated" as const };
  const body = bodyInput.trim();
  if (!body || body.length > 1000) return { ok: false as const, code: "invalid" as const };

  const { data, error } = await auth.supabase
    .from("community_episode_review_comments")
    .insert({ review_id: reviewId, user_id: auth.user.id, body })
    .select("id")
    .single();

  if (error) return { ok: false as const, code: "database_error" as const };
  return { ok: true as const, commentId: data.id };
}
