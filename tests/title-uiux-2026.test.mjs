import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homePage = await readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const titlePage = await readFile(new URL("../src/app/title/[id]/page.tsx", import.meta.url), "utf8");
const ratingDiary = await readFile(new URL("../src/components/RatingDiaryPanel.tsx", import.meta.url), "utf8");

test("approved FilmTrack homepage exposes cinematic live-content discovery", () => {
  assert.match(homePage, /bg-\[#050914\]/);
  assert.match(homePage, /trending\/movie\/week/);
  assert.match(homePage, /trending\/tv\/week/);
  assert.match(homePage, /MediaRail/);
  assert.match(homePage, /from-violet-600 to-blue-500/);
  assert.match(homePage, /خانه فارسی طرفداران فیلم و سریال/);
});

test("homepage removes the previous empty hero-only experience", () => {
  assert.doesNotMatch(homePage, /h-\[50vh\]/);
  assert.match(homePage, /منتخب این هفته/);
  assert.match(homePage, /کاوش بر اساس حال‌وهوای تماشا/);
  assert.match(homePage, /پوستر \$\{titleOf\(item\)\}/);
});

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
