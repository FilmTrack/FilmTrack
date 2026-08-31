import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const titlePage = await readFile(new URL("../src/app/title/[id]/page.tsx", import.meta.url), "utf8");
const ratingDiary = await readFile(new URL("../src/components/RatingDiaryPanel.tsx", import.meta.url), "utf8");

test("approved FilmTrack title experience keeps cinematic responsive hierarchy", () => {
  assert.match(titlePage, /lg:grid-cols-\[300px_minmax\(0,1fr\)_300px\]/);
  assert.match(titlePage, /bg-\[#050914\]/);
  assert.match(titlePage, /from-violet-600 to-blue-500/);
  assert.match(titlePage, /TmdbImage/);
});

test("title experience mounts the M2 rating and diary surface", () => {
  assert.match(titlePage, /RatingDiaryPanel/);
  assert.match(titlePage, /titleId=\{Number\(id\)\}/);
  assert.match(titlePage, /titleType=\{type\}/);
});

test("title experience preserves critical SEO and product integrations", () => {
  assert.match(titlePage, /application\/ld\+json/);
  assert.match(titlePage, /buildTitleStructuredData/);
  assert.match(titlePage, /ActionButtons/);
  assert.match(titlePage, /CommentsSection/);
  assert.match(titlePage, /getRottenTomatoesUrl/);
});

test("rating and diary controls remain accessible and mobile friendly", () => {
  assert.match(ratingDiary, /aria-label=\{`امتیاز \$\{value\} از 10`\}/);
  assert.match(ratingDiary, /min-h-11/);
  assert.match(ratingDiary, /min-h-12/);
  assert.match(ratingDiary, /role="status"/);
  assert.match(ratingDiary, /Rewatch/);
});

test("runtime readiness gate is still explicit", () => {
  assert.match(ratingDiary, /isRatingDiaryRuntimeEnabled\(\)/);
  assert.match(ratingDiary, /!enabled/);
});
