import { writeUserListEntry } from "./write";
import type { WatchStatus } from "./types";

export type BulkUserListEntry = {
  titleId: number;
  titleType: "movie" | "tv";
};

function normalizeEntries(entries: BulkUserListEntry[]) {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    const key = `${entry.titleType}:${entry.titleId}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function bulkWriteUserListEntries(
  entries: BulkUserListEntry[],
  status: WatchStatus = "plan_to_watch",
) {
  const normalizedEntries = normalizeEntries(entries);

  return Promise.all(
    normalizedEntries.map((entry) =>
      writeUserListEntry({
        ...entry,
        status,
      }),
    ),
  );
}
