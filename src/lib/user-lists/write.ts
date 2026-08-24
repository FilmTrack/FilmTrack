import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  TitleType,
  UserListStatus,
  UserListWriteInput,
} from "./types"

const canonicalKey = (entry: UserListWriteInput) =>
  `${entry.titleType}:${entry.titleId}`

export function normalizeUserListEntries(
  entries: UserListWriteInput[],
): UserListWriteInput[] {
  const canonicalEntries = new Map<string, UserListWriteInput>()

  for (const entry of entries) {
    if (!Number.isInteger(entry.titleId) || entry.titleId <= 0) {
      throw new Error("Invalid title id")
    }

    if (entry.titleType !== "movie" && entry.titleType !== "tv") {
      throw new Error("Invalid title type")
    }

    canonicalEntries.set(canonicalKey(entry), entry)
  }

  return [...canonicalEntries.values()]
}

export async function writeUserListEntries(
  supabase: SupabaseClient,
  userId: string,
  entries: UserListWriteInput[],
) {
  if (!userId) {
    throw new Error("Authenticated user id is required")
  }

  const normalized = normalizeUserListEntries(entries)

  if (normalized.length === 0) {
    return { error: null, written: 0 }
  }

  const rows = normalized.map((entry) => ({
    user_id: userId,
    title_id: entry.titleId,
    title_type: entry.titleType,
    status: entry.status,
  }))

  const { error } = await supabase
    .from("user_lists")
    .upsert(rows, {
      onConflict: "user_id,title_id,title_type",
    })

  return {
    error,
    written: error ? 0 : rows.length,
  }
}

export async function writeUserListEntry(
  supabase: SupabaseClient,
  userId: string,
  titleId: number,
  titleType: TitleType,
  status: UserListStatus,
) {
  return writeUserListEntries(supabase, userId, [
    {
      titleId,
      titleType,
      status,
    },
  ])
}
