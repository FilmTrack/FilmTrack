import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8")

const [writer, types, actionButtons, migration] = await Promise.all([
  read("src/lib/user-lists/write.ts"),
  read("src/lib/user-lists/types.ts"),
  read("src/components/ActionButtons.tsx"),
  read("supabase/migrations/20260819094500_m0_data_boundary_foundation.sql"),
])

test("shared user-list writer uses canonical FilmTrack identity", () => {
  assert.match(
    writer,
    /onConflict:\s*["']user_id,title_id,title_type["']/,
  )

  assert.match(
    migration,
    /unique\s*\(\s*user_id\s*,\s*title_id\s*,\s*title_type\s*\)/i,
  )
})

test("bulk writer normalizes duplicate title identities before persistence", () => {
  assert.match(writer, /new Map<string,\s*UserListWriteInput>/)
  assert.match(writer, /canonicalKey/)
  assert.match(writer, /normalized\.map/)
})

test("bulk writer preserves database-backed domain rules", () => {
  assert.match(types, /"movie"\s*\|\s*"tv"/)
  assert.match(types, /"plan_to_watch"/)
  assert.match(types, /"watching"/)
  assert.match(types, /"completed"/)
  assert.match(types, /"on_hold"/)
  assert.match(types, /"dropped"/)
})

test("single-title UI reuses the shared writer through the watchlist adapter", () => {
  assert.match(actionButtons, /saveWatchStatus/)
  assert.doesNotMatch(actionButtons, /\.from\(\s*["']user_lists["']\s*\)/)
  assert.doesNotMatch(actionButtons, /23505/)
})

test("legacy M0 rollout bridge is removed after verified production migration", () => {
  assert.doesNotMatch(actionButtons, /M0 rollout bridge/)
  assert.doesNotMatch(actionButtons, /legacyUpdateError/)
})
