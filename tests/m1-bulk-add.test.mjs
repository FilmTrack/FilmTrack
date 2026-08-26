import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [
  page,
  grid,
  card,
  hook,
] = await Promise.all([
  read("src/app/search/page.tsx"),
  read("src/components/search/SearchResultsGrid.tsx"),
  read("src/components/search/SearchResultCard.tsx"),
  read("src/lib/user-lists/use-selection.ts"),
]);

test("bulk add foundation has search selection architecture", () => {
  assert.match(page, /SearchResultsGrid/);
  assert.match(grid, /useSelection/);
  assert.match(card, /onToggle/);
  assert.match(hook, /toggle/);
  assert.match(hook, /clear/);
});
