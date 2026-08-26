import { createClient } from "@/lib/supabase/client";
import type {
  TitleType,
  UserListStatus,
  UserListWriteInput,
} from "./types";
import { writeUserListEntries } from "./write";

export type BulkUserListEntry = {
  titleId: number;
  titleType: TitleType;
};

export type BulkWriteResult =
  | { ok: true; userId: string; written: number }
  | { ok: false; reason: "unauthenticated" }
  | { ok: false; reason: "write_failed"; message: string };

export async function bulkWriteUserListEntries(
  entries: BulkUserListEntry[],
  status: UserListStatus = "plan_to_watch",
): Promise<BulkWriteResult> {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { ok: false, reason: "unauthenticated" };
  }

  const payload: UserListWriteInput[] = entries.map((entry) => ({
    titleId: entry.titleId,
    titleType: entry.titleType,
    status,
  }));

  const { error, written } = await writeUserListEntries(
    supabase,
    session.user.id,
    payload,
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
    written,
  };
}
