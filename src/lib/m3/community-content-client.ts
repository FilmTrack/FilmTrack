"use client";

import { createClient } from "@/lib/supabase/client";
import { isCommunityContentRuntimeEnabled } from "@/lib/m3/community-content-readiness";

type MediaType = "movie" | "tv";
type Visibility = "private" | "public";

async function currentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
}

export async function saveCommunityReview(input: {
  titleId: number;
  titleType: MediaType;
  body: string;
  containsSpoilers?: boolean;
  visibility?: Visibility;
}) {
  if (!isCommunityContentRuntimeEnabled()) return { ok: false as const, code: "disabled" as const };
  const auth = await currentUser();
  if (!auth) return { ok: false as const, code: "unauthenticated" as const };
  const body = input.body.trim();
  if (!body || body.length > 4000) return { ok: false as const, code: "invalid" as const };

  const { error } = await auth.supabase.from("community_reviews").upsert({
    user_id: auth.user.id,
    title_id: input.titleId,
    title_type: input.titleType,
    body,
    contains_spoilers: Boolean(input.containsSpoilers),
    visibility: input.visibility ?? "private",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,title_id,title_type" });

  if (error) return { ok: false as const, code: "database_error" as const };
  return { ok: true as const };
}

export async function setReviewLike(reviewId: string, liked: boolean) {
  if (!isCommunityContentRuntimeEnabled()) return { ok: false as const, code: "disabled" as const };
  const auth = await currentUser();
  if (!auth) return { ok: false as const, code: "unauthenticated" as const };

  const query = auth.supabase.from("community_review_likes");
  const { error } = liked
    ? await query.upsert({ review_id: reviewId, user_id: auth.user.id }, { onConflict: "review_id,user_id", ignoreDuplicates: true })
    : await query.delete().eq("review_id", reviewId).eq("user_id", auth.user.id);

  return error ? { ok: false as const, code: "database_error" as const } : { ok: true as const, liked };
}

export async function addReviewComment(reviewId: string, bodyInput: string) {
  if (!isCommunityContentRuntimeEnabled()) return { ok: false as const, code: "disabled" as const };
  const auth = await currentUser();
  if (!auth) return { ok: false as const, code: "unauthenticated" as const };
  const body = bodyInput.trim();
  if (!body || body.length > 1000) return { ok: false as const, code: "invalid" as const };

  const { error } = await auth.supabase.from("community_review_comments").insert({
    review_id: reviewId,
    user_id: auth.user.id,
    body,
  });
  return error ? { ok: false as const, code: "database_error" as const } : { ok: true as const };
}

export async function createCommunityList(input: {
  slug: string;
  name: string;
  description?: string;
  visibility?: Visibility;
}) {
  if (!isCommunityContentRuntimeEnabled()) return { ok: false as const, code: "disabled" as const };
  const auth = await currentUser();
  if (!auth) return { ok: false as const, code: "unauthenticated" as const };
  const slug = input.slug.trim().toLowerCase();
  const name = input.name.trim();
  if (!/^[a-z0-9-]{3,48}$/.test(slug) || !name || name.length > 80) return { ok: false as const, code: "invalid" as const };

  const { data, error } = await auth.supabase.from("community_lists").insert({
    user_id: auth.user.id,
    slug,
    name,
    description: input.description?.trim() || null,
    visibility: input.visibility ?? "private",
  }).select("id,slug").single();

  return error ? { ok: false as const, code: "database_error" as const } : { ok: true as const, list: data };
}
