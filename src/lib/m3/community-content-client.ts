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

async function recordActivity(auth: Awaited<ReturnType<typeof currentUser>>, input: {
  eventType: "review_created" | "review_liked" | "review_commented" | "list_created" | "list_updated";
  entityId?: string | null;
  titleId?: number | null;
  titleType?: MediaType | null;
  visibility?: Visibility;
}) {
  if (!auth) return;
  await auth.supabase.from("community_activity_events").insert({
    user_id: auth.user.id,
    event_type: input.eventType,
    entity_id: input.entityId ?? null,
    title_id: input.titleId ?? null,
    title_type: input.titleType ?? null,
    visibility: input.visibility ?? "private",
  });
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
  const visibility = input.visibility ?? "private";

  const { data, error } = await auth.supabase.from("community_reviews").upsert({
    user_id: auth.user.id,
    title_id: input.titleId,
    title_type: input.titleType,
    body,
    contains_spoilers: Boolean(input.containsSpoilers),
    visibility,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,title_id,title_type" }).select("id").single();

  if (error) return { ok: false as const, code: "database_error" as const };
  await recordActivity(auth, { eventType: "review_created", entityId: data.id, titleId: input.titleId, titleType: input.titleType, visibility });
  return { ok: true as const, reviewId: data.id };
}

export async function setReviewLike(reviewId: string, liked: boolean) {
  if (!isCommunityContentRuntimeEnabled()) return { ok: false as const, code: "disabled" as const };
  const auth = await currentUser();
  if (!auth) return { ok: false as const, code: "unauthenticated" as const };

  const query = auth.supabase.from("community_review_likes");
  const { error } = liked
    ? await query.upsert({ review_id: reviewId, user_id: auth.user.id }, { onConflict: "review_id,user_id", ignoreDuplicates: true })
    : await query.delete().eq("review_id", reviewId).eq("user_id", auth.user.id);

  if (error) return { ok: false as const, code: "database_error" as const };
  if (liked) await recordActivity(auth, { eventType: "review_liked", entityId: reviewId });
  return { ok: true as const, liked };
}

export async function addReviewComment(reviewId: string, bodyInput: string) {
  if (!isCommunityContentRuntimeEnabled()) return { ok: false as const, code: "disabled" as const };
  const auth = await currentUser();
  if (!auth) return { ok: false as const, code: "unauthenticated" as const };
  const body = bodyInput.trim();
  if (!body || body.length > 1000) return { ok: false as const, code: "invalid" as const };

  const { data, error } = await auth.supabase.from("community_review_comments").insert({
    review_id: reviewId,
    user_id: auth.user.id,
    body,
  }).select("id").single();
  if (error) return { ok: false as const, code: "database_error" as const };
  await recordActivity(auth, { eventType: "review_commented", entityId: data.id });
  return { ok: true as const, commentId: data.id };
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
  const visibility = input.visibility ?? "private";

  const { data, error } = await auth.supabase.from("community_lists").insert({
    user_id: auth.user.id,
    slug,
    name,
    description: input.description?.trim() || null,
    visibility,
  }).select("id,slug").single();

  if (error) return { ok: false as const, code: "database_error" as const };
  await recordActivity(auth, { eventType: "list_created", entityId: data.id, visibility });
  return { ok: true as const, list: data };
}

export async function addCommunityListItem(input: {
  listId: string;
  titleId: number;
  titleType: MediaType;
  note?: string;
  position?: number;
}) {
  if (!isCommunityContentRuntimeEnabled()) return { ok: false as const, code: "disabled" as const };
  const auth = await currentUser();
  if (!auth) return { ok: false as const, code: "unauthenticated" as const };

  const { error } = await auth.supabase.from("community_list_items").upsert({
    list_id: input.listId,
    title_id: input.titleId,
    title_type: input.titleType,
    note: input.note?.trim() || null,
    position: input.position ?? 0,
  }, { onConflict: "list_id,title_id,title_type" });

  if (error) return { ok: false as const, code: "database_error" as const };
  await recordActivity(auth, { eventType: "list_updated", entityId: input.listId, titleId: input.titleId, titleType: input.titleType });
  return { ok: true as const };
}
