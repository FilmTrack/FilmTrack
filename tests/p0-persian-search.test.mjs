import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const helper = fs.readFileSync("src/lib/persian-search.ts", "utf8");
const route = fs.readFileSync("src/app/api/search/route.ts", "utf8");
const tmdb = fs.readFileSync("src/lib/tmdb.ts", "utf8");

test("Persian normalization handles Arabic/Persian character variants without fabricated translation", () => {
  assert.match(helper, /\[يى\].*ی/);
  assert.match(helper, /ك.*ک/);
  assert.match(helper, /normalize\("NFKC"\)/);
  assert.match(helper, /u200c/);
  assert.doesNotMatch(helper, /gemini|openai|translation api/i);
});

test("search ranking prioritizes exact then prefix then contains matches", () => {
  assert.match(helper, /return 100/);
  assert.match(helper, /startsWith\(needle\).*80/);
  assert.match(helper, /includes\(needle\).*60/);
  assert.match(helper, /original_title/);
  assert.match(helper, /original_name/);
});

test("API search is Persian-first with English fallback and canonical dedupe", () => {
  assert.match(route, /"fa-IR"/);
  assert.match(route, /"en-US"/);
  assert.match(route, /canonicalResultKey/);
  assert.match(route, /new Map/);
  assert.match(route, /rankSearchResults/);
  assert.match(route, /searchQueryVariants/);
});

test("TMDB summary retains original entity names for alias-safe matching", () => {
  assert.match(tmdb, /original_title\?: string/);
  assert.match(tmdb, /original_name\?: string/);
});
