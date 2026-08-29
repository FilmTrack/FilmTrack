import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  verifyHomepageHtml,
  verifyRobotsText,
} from "../scripts/verify-production-seo.mjs";

const verifierSource = await readFile(
  new URL("../scripts/verify-production-seo.mjs", import.meta.url),
  "utf8",
);

test("homepage verifier requires canonical, entity and founder signals", () => {
  const html = `
    <html>
      <head>
        <link rel="canonical" href="https://www.filmtrack.ir/" />
        <script type="application/ld+json">
          {"@context":"https://schema.org","name":"FilmTrack","founder":{"name":"امیر متفکر","url":"https://amirmotefaker.ir"}}
        </script>
      </head>
      <body><a href="https://amirmotefaker.ir">امیر متفکر</a></body>
    </html>
  `;

  assert.doesNotThrow(() => verifyHomepageHtml(html));
});

test("homepage verifier rejects missing founder attribution", () => {
  const html = `
    <link rel="canonical" href="https://www.filmtrack.ir/" />
    <script type="application/ld+json">{"@context":"https://schema.org","name":"FilmTrack"}</script>
  `;

  assert.throws(
    () => verifyHomepageHtml(html),
    /founder attribution URL/,
  );
});

test("robots verifier requires AI crawler and private boundaries", () => {
  const robots = `
User-Agent: *
Allow: /
Disallow: /dashboard
Disallow: /auth
Disallow: /api/

User-Agent: OAI-SearchBot
Allow: /
Disallow: /dashboard
Disallow: /auth
Disallow: /api/

Sitemap: https://www.filmtrack.ir/sitemap.xml
  `;

  assert.doesNotThrow(() => verifyRobotsText(robots));
});

test("robots verifier rejects missing private exclusions", () => {
  assert.throws(
    () =>
      verifyRobotsText(
        "User-Agent: OAI-SearchBot\nSitemap: https://www.filmtrack.ir/sitemap.xml",
      ),
    /\/dashboard/,
  );
});

test("production verifier uses native UTF-8 fetch text instead of shell regex parsing", () => {
  assert.match(verifierSource, /await response\.text\(\)/);
  assert.doesNotMatch(verifierSource, /curl|powershell|Select-String/iu);
});
