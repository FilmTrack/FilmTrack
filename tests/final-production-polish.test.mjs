import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [layout, entitySeo, titlePage, navbar, footer, manifest] = await Promise.all([
  readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/seo/public-entity.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/title/[id]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/Navbar.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/Footer.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/manifest.ts", import.meta.url), "utf8"),
]);

test("root layout is the sole HTML page-title brand suffix authority", () => {
  assert.match(layout, /template:\s*"%s \| FilmTrack"/);
  assert.match(entitySeo, /title:\s*`\$\{title\} \| \$\{kindLabel\}`/);
  assert.match(entitySeo, /title:\s*pageTitle/);
  assert.doesNotMatch(entitySeo, /title:\s*`\$\{title\} \| \$\{kindLabel\} \| FilmTrack`/);
});

test("social metadata keeps complete standalone FilmTrack titles", () => {
  assert.match(entitySeo, /title:\s*`\$\{title\} \| FilmTrack`/);
  assert.match(entitySeo, /const socialTitle = `\$\{pageTitle\} \| FilmTrack`/);
});

test("title route stays noindex on missing TMDB data", () => {
  assert.match(titlePage, /robots:\s*\{ index: false, follow: true \}/);
});

test("mobile navigation and founder attribution remain production-visible", () => {
  assert.match(navbar, /md:hidden/);
  assert.match(navbar, /<LiveSearch\s*\/>/);
  assert.match(footer, /https:\/\/amirmotefaker\.ir/);
  assert.match(footer, /امیر متفکر/);
});

test("PWA manifest remains installed and mobile-oriented", () => {
  assert.match(manifest, /MetadataRoute\.Manifest/);
  assert.match(manifest, /display:\s*"standalone"/);
  assert.match(manifest, /short_name:\s*"FilmTrack"/);
  assert.match(manifest, /src:\s*"\/icon-192\.png"/);
  assert.match(manifest, /src:\s*"\/icon-512\.png"/);
  assert.match(manifest, /purpose:\s*"maskable"/);
});
