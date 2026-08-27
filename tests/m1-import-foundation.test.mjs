import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [
  types,
  normalize,
  persist,
  tvTime,
  letterboxd,
  trakt,
] = await Promise.all([
  read("src/lib/imports/types.ts"),
  read("src/lib/imports/normalize.ts"),
  read("src/lib/imports/persist.ts"),
  read("src/lib/imports/providers/tv-time.ts"),
  read("src/lib/imports/providers/letterboxd.ts"),
  read("src/lib/imports/providers/trakt.ts"),
]);

test("import domain stays provider agnostic", () => {
  assert.match(types, /CanonicalImportRecord/);
  assert.match(types, /ImportIdentityCandidate/);
  assert.match(types, /resolvedTitleId/);
  assert.match(types, /resolvedTitleType/);
  assert.match(types, /rating/);
  assert.match(types, /watchedAt/);
});

test("providers remain isolated adapters", () => {
  assert.match(tvTime, /provider:\s*"tv_time"/);
  assert.match(letterboxd, /provider:\s*"letterboxd"/);
  assert.match(trakt, /provider:\s*"trakt"/);

  assert.doesNotMatch(tvTime, /letterboxd|trakt/);
  assert.doesNotMatch(letterboxd, /tv_time|trakt/);
  assert.doesNotMatch(trakt, /tv_time|letterboxd/);
});

test("imports normalize duplicate identities deterministically", () => {
  assert.match(normalize, /new Map<string,\s*CanonicalImportRecord>/);
  assert.match(normalize, /resolved:/);
  assert.match(normalize, /tmdb:/);
  assert.match(normalize, /imdb:/);
});

test("import persistence reuses canonical authenticated writer", () => {
  assert.match(persist, /writeUserListEntries/);
  assert.match(persist, /userId/);
  assert.doesNotMatch(
    persist,
    /\.from\(\s*["']user_lists["']\s*\)/,
  );
});

test("unresolved imports cannot bypass resolution boundary", () => {
  assert.match(persist, /\.filter\(isResolvedImportRecord\)/);
  assert.match(types, /isResolvedImportRecord/);
});
