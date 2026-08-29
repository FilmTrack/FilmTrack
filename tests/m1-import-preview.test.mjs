import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [preview, component, index] = await Promise.all([
  read("src/lib/imports/preview.ts"),
  read(
    "src/components/imports/ImportPreviewSummary.tsx",
  ),
  read("src/lib/imports/index.ts"),
]);

test("dry-run preview summarizes every resolution state", () => {
  assert.match(preview, /resolved/);
  assert.match(preview, /ambiguous/);
  assert.match(preview, /unresolved/);
  assert.match(preview, /writable:\s*resolved/);
});

test("dry-run preview never persists user list data", () => {
  assert.doesNotMatch(
    preview,
    /writeUserListEntries/,
  );

  assert.doesNotMatch(
    preview,
    /\.from\(\s*["']user_lists["']\s*\)/,
  );
});

test("dry-run planner uses canonical resolution layer", () => {
  assert.match(
    preview,
    /resolveImportBatch/,
  );

  assert.match(
    preview,
    /normalizeImportRecords/,
  );
});

test("import preview UI exposes safe resolution states", () => {
  assert.match(component, /قابل ورود/);
  assert.match(component, /نیازمند بررسی/);
  assert.match(component, /پیدا نشد/);
  assert.match(component, /بدون تأیید ذخیره نمی‌شوند/);
});

test("import preview UI remains mobile responsive", () => {
  assert.match(
    component,
    /grid-cols-2/,
  );

  assert.match(
    component,
    /lg:grid-cols-4/,
  );
});

test("preview API is exported from imports domain", () => {
  assert.match(
    index,
    /export \* from "\.\/preview"/,
  );
});
