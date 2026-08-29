import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [
  dispatcher,
  letterboxd,
  trakt,
  tvTime,
  upload,
] = await Promise.all([
  read("src/lib/imports/parsers/index.ts"),
  read("src/lib/imports/parsers/letterboxd.ts"),
  read("src/lib/imports/parsers/trakt.ts"),
  read("src/lib/imports/parsers/tv-time.ts"),
  read("src/components/imports/ImportFileUpload.tsx"),
]);

test("provider parsers stay isolated", () => {
  assert.match(dispatcher, /letterboxd_requires_csv/);
  assert.match(dispatcher, /trakt_requires_csv/);
  assert.match(dispatcher, /unsupported_import_file/);
});

test("Letterboxd parser normalizes into canonical adapter", () => {
  assert.match(letterboxd, /letterboxdAdapter\.normalize/);
});

test("Trakt parser normalizes into canonical adapter", () => {
  assert.match(trakt, /traktAdapter\.normalize/);
});

test("TV Time parser supports guarded JSON and CSV paths", () => {
  assert.match(tvTime, /parseTvTimeJson/);
  assert.match(tvTime, /parseTvTimeCsv/);
  assert.match(tvTime, /unsupported_tv_time_json/);
});

test("upload UX performs preview before persistence", () => {
  assert.match(upload, /parseImportFile/);
  assert.match(upload, /buildImportPreview/);

  assert.doesNotMatch(upload, /writeUserListEntries/);
  assert.doesNotMatch(
    upload,
    /\.from\(\s*["']user_lists["']\s*\)/,
  );
});

test("upload UX is mobile friendly and file restricted", () => {
  assert.match(upload, /w-full/);
  assert.match(upload, /min-h-40/);
  assert.match(upload, /accept="\.csv,\.json/);
});
