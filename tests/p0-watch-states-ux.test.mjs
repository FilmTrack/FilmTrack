import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [types, actions, dashboard, importTypes] = await Promise.all([
  read("src/lib/user-lists/types.ts"),
  read("src/components/ActionButtons.tsx"),
  read("src/app/dashboard/page.tsx"),
  read("src/lib/imports/types.ts"),
]);

const statuses = ["plan_to_watch", "watching", "completed", "on_hold", "dropped"];

test("FilmTrack exposes exactly the five canonical watch states", () => {
  for (const status of statuses) assert.match(types, new RegExp(`"${status}"`));
  assert.equal((types.match(/^  "[a-z_]+",$/gm) || []).length, 5);
});

test("title actions let users select every canonical state", () => {
  for (const status of statuses) assert.match(actions, new RegExp(`status: "${status}"`));
  assert.match(actions, /STATUS_OPTIONS\.map/);
});

test("dashboard labels and filters every canonical state without collapsing hold or dropped", () => {
  for (const status of statuses) assert.match(dashboard, new RegExp(`${status}:`));
  assert.match(dashboard, /متوقف موقت/);
  assert.match(dashboard, /رها شده/);
  assert.match(dashboard, /USER_LIST_STATUSES\.map/);
  assert.match(dashboard, /status=\$\{status\}/);
  assert.doesNotMatch(dashboard, /db\.status === "completed" \? "تماشا شده" : "در صف تماشا"/);
});

test("import pipeline reuses canonical UserListStatus rather than a second status model", () => {
  assert.match(importTypes, /UserListStatus/);
  assert.match(importTypes, /status\?: UserListStatus/);
  assert.match(importTypes, /status: UserListStatus/);
});
