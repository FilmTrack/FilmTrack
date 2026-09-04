import type { SupabaseClient } from "@supabase/supabase-js";

import { writeUserListEntries } from "../user-lists/write";
import { normalizeImportRecords } from "./normalize";
import {
  resolveImportBatch,
  type ImportIdentityResolver,
} from "./resolve";
import {
  isResolvedImportRecord,
  toUserListWriteInput,
  type CanonicalImportRecord,
} from "./types";

export async function persistResolvedImports(
  supabase: SupabaseClient,
  userId: string,
  records: CanonicalImportRecord[],
  resolver?: ImportIdentityResolver,
) {
  const normalized = normalizeImportRecords(records);

  const resolutionResults = await resolveImportBatch(
    normalized,
    resolver,
  );

  const entries = resolutionResults
    .filter((result) => result.status === "resolved")
    .map((result) => result.record)
    .filter(isResolvedImportRecord)
    .map(toUserListWriteInput);

  return writeUserListEntries(
    supabase,
    userId,
    entries,
  );
}
