import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [page, upload, dispatcher, preview, resolver] = await Promise.all([
  read("src/app/dashboard/import/page.tsx"),
  read("src/components/imports/ImportFileUpload.tsx"),
  read("src/lib/imports/parsers/index.ts"),
  read("src/lib/imports/preview.ts"),
  read("src/lib/imports/resolve.ts"),
]);

test("migration center is authenticated and private", () => {
  assert.match(page, /if \(!userId\) redirect\("\/auth"\)/);
  assert.match(page, /index: false/);
  assert.match(page, /ImportFileUpload/);
});

test("migration preview never writes directly to user data", () => {
  assert.match(upload, /parseImportFile/);
  assert.match(upload, /buildImportPreview/);
  assert.doesNotMatch(upload, /\.insert\(|\.upsert\(|\.update\(|\.delete\(/);
  assert.doesNotMatch(upload, /user_lists/);
});

test("provider formats remain isolated", () => {
  assert.match(dispatcher, /letterboxd_requires_csv/);
  assert.match(dispatcher, /trakt_requires_csv/);
  assert.match(dispatcher, /parseTvTimeJson/);
  assert.match(dispatcher, /parseTvTimeCsv/);
});

test("dry-run only marks deterministic identities writable", () => {
  assert.match(preview, /writable: resolved/);
  assert.match(resolver, /directTmdbCandidate/);
  assert.match(resolver, /status: "unresolved"/);
  assert.match(resolver, /status: "ambiguous"/);
});
