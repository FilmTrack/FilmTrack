import { writeUserListEntry } from "./write";
import type { WatchStatus } from "./types";

export type BulkUserListEntry = {
  titleId: number;
  titleType: "movie" | "tv";
};

export async function bulkWriteUserListEntries(
  entries: BulkUserListEntry[],
  status: WatchStatus = "plan_to_watch",
) {
  const results = [];

  for (const entry of entries) {
    results.push(
      await writeUserListEntry({
        ...entry,
        status,
      }),
    );
  }

  return results;
}
