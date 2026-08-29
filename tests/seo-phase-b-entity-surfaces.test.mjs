import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [source, titlePage, genrePage, sitemap] = await Promise.all([
  readFile(new URL("../src/lib/seo/public-entity.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/title/[id]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/genre/[id]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/sitemap.ts", import.meta.url), "utf8"),
]);

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

test("title route wires dynamic metadata and JSON-LD into rendered output", () => {
  assert.match(titlePage, /export async function generateMetadata/);
  assert.match(titlePage, /buildTitleMetadata/);
  assert.match(titlePage, /buildTitleStructuredData/);
  assert.match(titlePage, /type="application\/ld\+json"/);
  assert.match(titlePage, /JSON\.stringify\(structuredData\)/);
});

test("title route keeps missing TMDB data out of the index", () => {
  assert.match(titlePage, /robots:\s*\{ index: false, follow: true \}/);
});

test("genre route wires metadata, noindex pagination and breadcrumb JSON-LD", () => {
  assert.match(genrePage, /export async function generateMetadata/);
  assert.match(genrePage, /buildGenreMetadata/);
  assert.match(genrePage, /buildGenreBreadcrumb/);
  assert.match(genrePage, /type="application\/ld\+json"/);
});

test("sitemap exposes stable genre discovery URLs without pagination", () => {
  assert.match(sitemap, /stableGenreIds/);
  assert.match(sitemap, /\/genre\/\$\{id\}/);
  assert.doesNotMatch(sitemap, /\?page=/);
});
