import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [searchPage, searchRoute] = await Promise.all([
  read("src/app/search/page.tsx"),
  read("src/app/api/search/route.ts"),
]);

test("search page consumes the API array contract", () => {
  assert.match(
    searchPage,
    /fetchJson<TmdbMediaSummary\[\]>/,
  );

  assert.match(
    searchPage,
    /results\s*=\s*data\s*\?\?\s*\[\]/,
  );

  assert.doesNotMatch(
    searchPage,
    /data\?\.results/,
  );
});

test("search API returns ranked canonical result arrays directly", () => {
  assert.match(
    searchRoute,
    /NextResponse\.json\(results/,
  );

  assert.match(
    searchRoute,
    /new Map<string,\s*TmdbMediaSummary/,
  );

  assert.match(
    searchRoute,
    /canonicalResultKey\(item\)/,
  );

  assert.match(
    searchRoute,
    /rankSearchResults\(\[\.\.\.merged\.values\(\)\],\s*rawQuery\)\.slice\(0,\s*7\)/,
  );
});
