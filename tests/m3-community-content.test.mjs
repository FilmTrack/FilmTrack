import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [migration, readiness, client, titlePage, dashboardPage, feedPage] = await Promise.all([
  read("supabase/migrations/20260903110500_m3_community_content_foundation.sql"),
  read("src/lib/m3/community-content-readiness.ts"),
  read("src/lib/m3/community-content-client.ts"),
  read("src/app/title/[id]/community/page.tsx"),
  read("src/app/dashboard/community/content/page.tsx"),
  read("src/app/community/feed/page.tsx"),
]);

test("community content schema covers review, interaction, list and activity primitives", () => {
  for (const table of ["community_reviews", "community_review_likes", "community_review_comments", "community_lists", "community_list_items", "community_activity_events"]) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(migration, /visibility text not null default 'private'/);
  assert.match(migration, /revoke all privileges/);
  assert.doesNotMatch(migration, /grant .* to anon/i);
});

test("content runtime requires both community and dedicated content flags", () => {
  assert.match(readiness, /isCommunityRuntimeEnabled\(\)/);
  assert.match(readiness, /NEXT_PUBLIC_FILMTRACK_M3_COMMUNITY_CONTENT_ENABLED/);
  assert.match(readiness, /=== "true"/);
});

test("all new routes return before community-content table reads when disabled", () => {
  for (const source of [titlePage, dashboardPage, feedPage]) {
    const gate = source.indexOf("if (!isCommunityContentRuntimeEnabled())");
    assert.ok(gate >= 0, "route must have explicit disabled gate");
    for (const table of ["community_reviews", "community_lists", "community_activity_events"]) {
      const readIndex = source.indexOf(`.from(\"${table}\")`);
      if (readIndex >= 0) assert.ok(gate < readIndex, `${table} read must occur after gate`);
    }
  }
});

test("writers are auth-bound, default-private and zero paid-AI", () => {
  assert.match(client, /auth\.getUser\(\)/);
  assert.match(client, /visibility \?\? "private"/);
  assert.match(client, /user_id: auth\.user\.id/);
  assert.doesNotMatch(client, /openai|gemini|anthropic|groq/i);
});

test("community content surfaces stay private/noindex until public contracts are separately approved", () => {
  assert.match(titlePage, /robots: \{ index: false, follow: false \}/);
  assert.match(dashboardPage, /robots: \{ index: false, follow: false \}/);
  assert.match(feedPage, /robots: \{ index: false, follow: false \}/);
  assert.match(titlePage, /redirect\(`/);
  assert.match(dashboardPage, /redirect\("\/auth"\)/);
  assert.match(feedPage, /redirect\("\/auth"\)/);
});
