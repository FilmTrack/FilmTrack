import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [
  actionButtons,
  watchlistClient,
  userListWriter,
  commentsSection,
  titlePage,
  dashboard,
  migration,
] = await Promise.all([
  read("src/components/ActionButtons.tsx"),
  read("src/lib/watchlist-client.ts"),
  read("src/lib/user-lists/write.ts"),
  read("src/components/CommentsSection.tsx"),
  read("src/app/title/[id]/page.tsx"),
  read("src/app/dashboard/page.tsx"),
  read("supabase/migrations/20260819094500_m0_data_boundary_foundation.sql"),
]);

test("user_lists media identity includes title_type in migration", () => {
  assert.match(
    migration,
    /unique\s*\(\s*user_id\s*,\s*title_id\s*,\s*title_type\s*\)/i,
  );
  assert.doesNotMatch(
    migration,
    /unique\s*\(\s*user_id\s*,\s*title_id\s*\)\s*;/i,
  );
});

test("watchlist writes use canonical three-column identity after M0 closure", () => {
  assert.match(actionButtons, /saveWatchStatus/);
  assert.match(watchlistClient, /writeUserListEntry/);
  assert.doesNotMatch(watchlistClient, /UNIQUE_VIOLATION/);
  assert.doesNotMatch(watchlistClient, /legacyUpdateError/);
  assert.match(
    userListWriter,
    /onConflict:\s*["']user_id,title_id,title_type["']/,
  );
});
test("comments are type-scoped and no longer persist/display raw email", () => {
  assert.match(
    titlePage,
    /\.eq\(\s*['"]title_type['"]\s*,\s*type\s*\)/,
  );
  assert.match(
    titlePage,
    /\.select\(\s*['"]id, content, is_spoiler, created_at['"]\s*\)/,
  );
  assert.doesNotMatch(commentsSection, /user_email/);
  assert.doesNotMatch(commentsSection, /session\.user\.email/);
  assert.match(migration, /drop column if exists user_email/i);
});

test("server data access verifies identity and dashboard filters ownership", () => {
  assert.match(titlePage, /auth\.getClaims\(\)/);
  assert.match(dashboard, /auth\.getClaims\(\)/);
  assert.doesNotMatch(dashboard, /auth\.getSession\(\)/);
  assert.match(
    dashboard,
    /\.eq\(\s*['"]user_id['"]\s*,\s*userId\s*\)/,
  );
});

test("RLS policies and grants are narrowed", () => {
  assert.match(
    migration,
    /for select\s+to authenticated\s+using\s*\(\(select auth\.uid\(\)\)\s*=\s*user_id\)/i,
  );
  assert.match(
    migration,
    /for insert\s+to authenticated\s+with check\s*\(\(select auth\.uid\(\)\)\s*=\s*user_id\)/i,
  );
  assert.match(
    migration,
    /revoke all privileges\s+on table public\.comments\s+from anon, authenticated/i,
  );
  assert.match(
    migration,
    /grant select\s+on table public\.comments\s+to anon/i,
  );
  assert.match(
    migration,
    /grant select, insert, update, delete\s+on table public\.user_lists\s+to authenticated/i,
  );
});

test("migration adds indexes for RLS and title-scoped comments", () => {
  assert.match(migration, /user_lists_user_id_created_at_idx/i);
  assert.match(migration, /comments_user_id_idx/i);
  assert.match(migration, /comments_title_identity_created_at_idx/i);
});
