import { createClient } from "@/lib/supabase/client";

export type WatchStatus =
  | "plan_to_watch"
  | "watching"
  | "completed"
  | "on_hold"
  | "dropped";

type SaveWatchStatusInput = {
  titleId: number;
  titleType: "movie" | "tv";
  status: WatchStatus;
};

type SaveWatchStatusResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "unauthenticated" }
  | { ok: false; reason: "write_failed"; message: string };

const UNIQUE_VIOLATION = "23505";

export async function saveWatchStatus({
  titleId,
  titleType,
  status,
}: SaveWatchStatusInput): Promise<SaveWatchStatusResult> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { ok: false, reason: "unauthenticated" };

  const row = {
    user_id: session.user.id,
    title_id: titleId,
    title_type: titleType,
    status,
  };

  const { error: insertError } = await supabase.from("user_lists").insert(row);
  let error = insertError;

  // M0 compatibility bridge: canonical identity is
  // (user_id,title_id,title_type), while production may briefly still be on
  // the legacy two-column uniqueness rule during controlled migration.
  if (error?.code === UNIQUE_VIOLATION) {
    const { data: exactRows, error: exactUpdateError } = await supabase
      .from("user_lists")
      .update({ status })
      .eq("user_id", session.user.id)
      .eq("title_id", titleId)
      .eq("title_type", titleType)
      .select("id");

    error = exactUpdateError;

    if (!error && (exactRows?.length ?? 0) === 0) {
      const { error: legacyUpdateError } = await supabase
        .from("user_lists")
        .update({ title_type: titleType, status })
        .eq("user_id", session.user.id)
        .eq("title_id", titleId);

      error = legacyUpdateError;
    }
  }

  if (error) {
    return { ok: false, reason: "write_failed", message: error.message };
  }

  return { ok: true, userId: session.user.id };
}
