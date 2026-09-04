import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [engine, page, v2Engine] = await Promise.all([
  read("src/lib/m4/recommendations.ts"),
  read("src/app/dashboard/recommendations/page.tsx"),
  read("src/lib/m4/recommendation-v2.ts"),
]);

test("taste profile is built from first-party FilmTrack signals", () => {
  assert.match(engine, /buildTasteSeeds/);
  assert.match(engine, /status === "completed"/);
  assert.match(engine, /rating10 < 7/);
  assert.match(engine, /diaryCounts/);
  assert.match(engine, /count > 1/);
  assert.match(page, /computeTasteDNA/);
});

test("recommendations exclude existing canonical identities and deduplicate candidates", () => {
  assert.match(engine, /excludedKeys\.has\(identityKey/);
  assert.match(engine, /mergeRecommendationCandidates/);
  assert.match(engine, /new Map<string, RecommendationCandidate>/);
  assert.match(page, /existingKeys/);
  assert.match(page, /excludedKeys: existingKeys/);
});

test("private recommendation page preserves M2 readiness boundary", () => {
  assert.match(page, /isRatingDiaryRuntimeEnabled\(\)/);
  assert.ok(
    page.indexOf("if (isRatingDiaryRuntimeEnabled())") < page.indexOf('.from("user_ratings")'),
    "rating/diary reads must stay behind the M2 runtime gate",
  );
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(page, /if \(!userId\) redirect\("\/auth"\)/);
});

test("recommendation v2 is zero-cost, explainable and does not write user data", () => {
  assert.match(page, /recommendations\?page=1/);
  assert.match(page, /recommendation\.reasons/);
  assert.match(v2Engine, /reasons\.push/);
  assert.match(page, /TMDB/);
  assert.doesNotMatch(`${page}\n${v2Engine}`, /openai|gemini|anthropic|groq/i);
  assert.doesNotMatch(page, /\.insert\(|\.upsert\(|\.update\(|\.delete\(/);
});

test("cold start remains explicit and mobile-first in v2", () => {
  assert.match(page, /برای Recommendation v2 دقیق‌تر/);
  assert.match(page, /هنوز پیشنهاد کافی نداریم/);
  assert.match(page, /grid-cols-2/);
  assert.match(page, /sm:grid-cols-3/);
});
