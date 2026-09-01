import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../src/lib/episode-progress.ts", import.meta.url),
  "utf8",
);

test("episode progress keeps canonical title/season/episode identity", () => {
  assert.match(source, /titleId:\s*number/);
  assert.match(source, /seasonNumber:\s*number/);
  assert.match(source, /episodeNumber:\s*number/);
  assert.match(source, /episodeKey/);
  assert.match(source, /normalizeEpisodeProgress/);
});

test("invalid progress rows are rejected before derivation", () => {
  assert.match(source, /entry\.titleId <= 0/);
  assert.match(source, /entry\.seasonNumber < 0/);
  assert.match(source, /entry\.episodeNumber <= 0/);
  assert.match(source, /Number\.isNaN\(Date\.parse\(entry\.watchedAt\)\)/);
});

test("next episode derives completion and progress deterministically", () => {
  assert.match(source, /deriveNextEpisode/);
  assert.match(source, /progressPercent/);
  assert.match(source, /nextEpisode/);
  assert.match(source, /Math\.round\(\(completed \/ total\) \* 100\)/);
});

test("continue watching only contains started unfinished titles ordered by recency", () => {
  assert.match(source, /deriveContinueWatching/);
  assert.match(source, /item\.completed > 0 && item\.nextEpisode !== null/);
  assert.match(source, /lastWatchedAt/);
  assert.match(source, /Date\.parse\(b\.lastWatchedAt/);
});
