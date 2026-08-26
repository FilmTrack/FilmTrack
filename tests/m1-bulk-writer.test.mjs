import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const bulk = fs.readFileSync(
  new URL("../src/lib/user-lists/bulk.ts", import.meta.url),
  "utf8",
);

test("bulk writer delegates normalization to canonical multi-entry writer", () => {
  assert.match(bulk, /writeUserListEntries/);
  assert.match(bulk, /UserListWriteInput/);
  assert.doesNotMatch(bulk, /function normalizeEntries/);
});

test("bulk writer delegates persistence to canonical multi-entry writer", () => {
  assert.match(bulk, /writeUserListEntries\s*\(/);
  assert.match(bulk, /session\.user\.id/);
});

test("bulk writer requires an authenticated session", () => {
  assert.match(bulk, /supabase\.auth\.getSession\(\)/);
  assert.match(bulk, /reason:\s*"unauthenticated"/);
});

test("bulk writer preserves canonical status and title identity", () => {
  assert.match(bulk, /titleId:\s*entry\.titleId/);
  assert.match(bulk, /titleType:\s*entry\.titleType/);
  assert.match(bulk, /status/);
});
