import { createClient } from "@/lib/supabase/client";
import type { UserListStatus } from "@/lib/user-lists/types";
import { writeUserListEntry } from "@/lib/user-lists/write";

export type WatchStatus = UserListStatus;

type SaveWatchStatusInput = {
  titleId: number;
  titleType: "movie" | "tv";
  status: WatchStatus;
};

type SaveWatchStatusResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "unauthenticated" }
  | { ok: false; reason: "write_failed"; message: string };

export async function saveWatchStatus({
  titleId,
  titleType,
  status,
}: SaveWatchStatusInput): Promise<SaveWatchStatusResult> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { ok: false, reason: "unauthenticated" };
  }

  const { error } = await writeUserListEntry(
    supabase,
    session.user.id,
    titleId,
    titleType,
    status,
  );

  if (error) {
    return {
      ok: false,
      reason: "write_failed",
      message: error.message,
    };
  }

  return {
    ok: true,
    userId: session.user.id,
  };
}
