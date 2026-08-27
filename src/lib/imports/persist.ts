import type { SupabaseClient } from "@supabase/supabase-js";

import { writeUserListEntries } from "../user-lists/write";
import {
  isResolvedImportRecord,
  toUserListWriteInput,
  type CanonicalImportRecord,
} from "./types";
import { normalizeImportRecords } from "./normalize";

export async function persistResolvedImports(
  supabase: SupabaseClient,
  userId: string,
  records: CanonicalImportRecord[],
) {
  const normalized = normalizeImportRecords(records);

  const entries = normalized
    .filter(isResolvedImportRecord)
    .map(toUserListWriteInput);

  return writeUserListEntries(
    supabase,
    userId,
    entries,
  );
}
