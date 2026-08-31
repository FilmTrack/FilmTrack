import { createClient } from "@/lib/supabase/client";
import { trackProductEvent } from "@/lib/product-events";
import { isRatingDiaryRuntimeEnabled } from "./readiness";

export type RatingDiaryTitleType = "movie" | "tv";

type RuntimeBlocked = { ok: false; reason: "runtime_unavailable" };
type Unauthenticated = { ok: false; reason: "unauthenticated" };
type InvalidInput = { ok: false; reason: "invalid_input"; message: string };
type WriteFailed = { ok: false; reason: "write_failed"; message: string };
type MutationSuccess = { ok: true; userId: string };

export type RatingDiaryMutationResult =
  | RuntimeBlocked
  | Unauthenticated
  | InvalidInput
  | WriteFailed
  | MutationSuccess;

function validateTitleIdentity(titleId: number, titleType: RatingDiaryTitleType) {
  if (!Number.isInteger(titleId) || titleId <= 0) {
    return "Invalid title id";
  }

  if (titleType !== "movie" && titleType !== "tv") {
    return "Invalid title type";
  }

  return null;
}

async function getAuthenticatedRuntime() {
  if (!isRatingDiaryRuntimeEnabled()) {
    return { ok: false as const, reason: "runtime_unavailable" as const };
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { ok: false as const, reason: "unauthenticated" as const };
  }

  return { ok: true as const, supabase, userId: session.user.id };
}

export async function saveRating(input: {
  titleId: number;
  titleType: RatingDiaryTitleType;
  rating10: number;
}): Promise<RatingDiaryMutationResult> {
  const identityError = validateTitleIdentity(input.titleId, input.titleType);
  if (identityError) {
    return { ok: false, reason: "invalid_input", message: identityError };
  }

  if (!Number.isInteger(input.rating10) || input.rating10 < 1 || input.rating10 > 10) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "Rating must be an integer from 1 to 10",
    };
  }

  const runtime = await getAuthenticatedRuntime();
  if (!runtime.ok) return runtime;

  const { error } = await runtime.supabase.from("user_ratings").upsert(
    {
      user_id: runtime.userId,
      title_id: input.titleId,
      title_type: input.titleType,
      rating_10: input.rating10,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,title_id,title_type" },
  );

  if (error) {
    return { ok: false, reason: "write_failed", message: error.message };
  }

  void trackProductEvent("rating_updated", {
    source: "title_detail",
    title_type: input.titleType,
    rating_10: input.rating10,
  });

  return { ok: true, userId: runtime.userId };
}

export async function removeRating(input: {
  titleId: number;
  titleType: RatingDiaryTitleType;
}): Promise<RatingDiaryMutationResult> {
  const identityError = validateTitleIdentity(input.titleId, input.titleType);
  if (identityError) {
    return { ok: false, reason: "invalid_input", message: identityError };
  }

  const runtime = await getAuthenticatedRuntime();
  if (!runtime.ok) return runtime;

  const { error } = await runtime.supabase
    .from("user_ratings")
    .delete()
    .eq("user_id", runtime.userId)
    .eq("title_id", input.titleId)
    .eq("title_type", input.titleType);

  if (error) {
    return { ok: false, reason: "write_failed", message: error.message };
  }

  void trackProductEvent("rating_removed", {
    source: "title_detail",
    title_type: input.titleType,
  });

  return { ok: true, userId: runtime.userId };
}

export async function addDiaryEntry(input: {
  titleId: number;
  titleType: RatingDiaryTitleType;
  watchedOn: string;
}): Promise<RatingDiaryMutationResult> {
  const identityError = validateTitleIdentity(input.titleId, input.titleType);
  if (identityError) {
    return { ok: false, reason: "invalid_input", message: identityError };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.watchedOn)) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "watchedOn must use YYYY-MM-DD",
    };
  }

  const runtime = await getAuthenticatedRuntime();
  if (!runtime.ok) return runtime;

  const { error } = await runtime.supabase.from("diary_entries").insert({
    user_id: runtime.userId,
    title_id: input.titleId,
    title_type: input.titleType,
    watched_on: input.watchedOn,
  });

  if (error) {
    return { ok: false, reason: "write_failed", message: error.message };
  }

  void trackProductEvent("diary_entry_created", {
    source: "title_detail",
    title_type: input.titleType,
  });

  return { ok: true, userId: runtime.userId };
}

export async function removeDiaryEntry(entryId: number): Promise<RatingDiaryMutationResult> {
  if (!Number.isInteger(entryId) || entryId <= 0) {
    return {
      ok: false,
      reason: "invalid_input",
      message: "Invalid diary entry id",
    };
  }

  const runtime = await getAuthenticatedRuntime();
  if (!runtime.ok) return runtime;

  const { error } = await runtime.supabase
    .from("diary_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", runtime.userId);

  if (error) {
    return { ok: false, reason: "write_failed", message: error.message };
  }

  void trackProductEvent("diary_entry_removed", { source: "diary" });

  return { ok: true, userId: runtime.userId };
}
