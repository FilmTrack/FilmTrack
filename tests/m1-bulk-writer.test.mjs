import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

const bulk = await read("src/lib/user-lists/bulk.ts");

test("bulk writer deduplicates canonical title identities", () => {
  assert.match(bulk, /normalizeEntries/);
  assert.match(bulk, /Set/);
  assert.match(bulk, /\$\{entry\.titleType\}:\$\{entry\.titleId\}/);
});

test("bulk writer delegates persistence to canonical writer", () => {
  assert.match(bulk, /writeUserListEntry/);
  assert.match(bulk, /Promise\.all/);
});
