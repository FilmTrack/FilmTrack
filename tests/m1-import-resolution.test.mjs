import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [resolve, persist, index] = await Promise.all([
  read("src/lib/imports/resolve.ts"),
  read("src/lib/imports/persist.ts"),
  read("src/lib/imports/index.ts"),
]);

test("identity resolution is provider independent", () => {
  assert.match(resolve, /ImportIdentityResolver/);
  assert.match(resolve, /ImportResolutionCandidate/);
  assert.match(resolve, /ImportResolutionStatus/);

  assert.doesNotMatch(
    resolve,
    /tv_time|letterboxd|trakt/,
  );
});

test("explicit TMDB identity resolves without provider coupling", () => {
  assert.match(resolve, /directTmdbCandidate/);
  assert.match(resolve, /reason:\s*"tmdb_id"/);
  assert.match(resolve, /resolvedTitleId/);
  assert.match(resolve, /resolvedTitleType/);
});

test("ambiguous candidates remain blocked from persistence", () => {
  assert.match(
    resolve,
    /status:\s*"ambiguous"/,
  );

  assert.match(
    persist,
    /result\.status === "resolved"/,
  );
});

test("unresolved records require a resolver before persistence", () => {
  assert.match(resolve, /if \(!resolver\)/);
  assert.match(resolve, /status:\s*"unresolved"/);
});

test("persistence still uses canonical user-list writer only", () => {
  assert.match(persist, /writeUserListEntries/);
  assert.match(persist, /resolveImportBatch/);

  assert.doesNotMatch(
    persist,
    /\.from\(\s*["']user_lists["']\s*\)/,
  );
});

test("resolver is exported through the import domain", () => {
  assert.match(
    index,
    /export \* from "\.\/resolve"/,
  );
});
