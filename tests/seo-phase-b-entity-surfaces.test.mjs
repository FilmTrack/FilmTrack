import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../src/lib/seo/public-entity.ts", import.meta.url),
  "utf8",
);

test("title canonical preserves movie and TV identity", () => {
  assert.match(source, /\/title\/\$\{encodedId\}\?type=\$\{type\}/);
  assert.match(source, /TmdbMediaType/);
});

test("title metadata owns route canonical and social identity", () => {
  assert.match(source, /buildTitleMetadata/);
  assert.match(source, /alternates:\s*\{ canonical \}/);
  assert.match(source, /openGraph:/);
  assert.match(source, /twitter:/);
  assert.match(source, /poster_path/);
});

test("structured title data exposes only visible TMDB-backed facts", () => {
  assert.match(source, /"@type": type === "tv" \? "TVSeries" : "Movie"/);
  assert.match(source, /datePublished/);
  assert.match(source, /genre:/);
  assert.match(source, /AggregateRating/);
  assert.match(source, /vote_count > 0/);
  assert.doesNotMatch(source, /Review|offers|price|actor:/);
});

test("title and genre surfaces include breadcrumb structure", () => {
  assert.match(source, /BreadcrumbList/);
  assert.match(source, /buildGenreBreadcrumb/);
  assert.match(source, /\/genres/);
});

test("paginated genre URLs are noindex follow with stable canonical", () => {
  assert.match(source, /isPaginated \? \{ index: false, follow: true \}/);
  assert.match(source, /canonicalGenreUrl/);
  assert.match(source, /alternates:\s*\{ canonical \}/);
});

test("SEO descriptions are bounded for search snippets", () => {
  assert.match(source, /normalized.length > 155/);
  assert.match(source, /slice\(0, 152\)/);
});
