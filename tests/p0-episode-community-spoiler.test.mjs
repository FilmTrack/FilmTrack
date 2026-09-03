import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [migration, readiness, client, route, episodesPage] = await Promise.all([
  read("supabase/migrations/20260903143000_episode_community_spoiler_foundation.sql"),
  read("src/lib/m3/episode-community-readiness.ts"),
  read("src/lib/m3/episode-community-client.ts"),
  read("src/app/title/[id]/episodes/[season]/[episode]/community/page.tsx"),
  read("src/app/title/[id]/episodes/page.tsx"),
]);

test("episode community schema is RLS-protected and watched-gated for writers", () => {
  for (const table of ["community_episode_reviews", "community_episode_review_comments"]) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(migration, /exists\([\s\S]*public\.episode_progress ep/);
  assert.match(migration, /ep\.user_id=\(select auth\.uid\(\)\)/);
  assert.match(migration, /visibility text not null default 'private'/);
  assert.doesNotMatch(migration, /grant .* to anon/i);
});

test("episode community runtime is layered behind existing community content flag", () => {
  assert.match(readiness, /isCommunityContentRuntimeEnabled\(\)/);
  assert.match(readiness, /NEXT_PUBLIC_FILMTRACK_M3_EPISODE_COMMUNITY_ENABLED/);
  assert.match(readiness, /=== "true"/);
});

test("runtime spoiler boundary returns before episode-community reads", () => {
  const watchedGate = route.indexOf("if (!isWatched)");
  const reviewRead = route.indexOf('.from("community_episode_reviews")');
  const commentRead = route.indexOf('.from("community_episode_review_comments")');
  assert.ok(watchedGate >= 0);
  assert.ok(reviewRead > watchedGate, "review rows must not be read before watched gate");
  assert.ok(commentRead > watchedGate, "comment rows must not be read before watched gate");
  assert.match(route, /محافظ اسپویل فعال است/);
});

test("episode writers are auth-bound and zero paid-AI", () => {
  assert.match(client, /auth\.getUser\(\)/);
  assert.match(client, /user_id: auth\.user\.id/);
  assert.match(client, /visibility: input\.visibility \?\? "private"/);
  assert.doesNotMatch(client, /openai|gemini|anthropic|groq/i);
});

test("episode tracking UI exposes community entry and private route stays noindex", () => {
  assert.match(episodesPage, /امتیاز و گفت‌وگو/);
  assert.match(episodesPage, /گفت‌وگو بعد از تماشا/);
  assert.match(route, /robots: \{ index: false, follow: false \}/);
  assert.match(route, /if \(!userId\) redirect\("\/auth"\)/);
});
