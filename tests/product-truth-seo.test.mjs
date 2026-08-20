import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [home, navbar, footer, sitemap, robots, layout, nextConfig, readme] =
  await Promise.all([
    read("src/app/page.tsx"),
    read("src/components/Navbar.tsx"),
    read("src/components/Footer.tsx"),
    read("src/app/sitemap.ts"),
    read("src/app/robots.ts"),
    read("src/app/layout.tsx"),
    read("next.config.ts"),
    read("README.md"),
  ]);

test("public copy does not make unsupported community or behavioral claims", () => {
  for (const source of [home, navbar, footer]) {
    assert.doesNotMatch(source, /بزرگترین جامعه/);
    assert.doesNotMatch(source, /بیشترین بیننده|بیشترین اضافه‌شده|Binged/);
  }
  assert.match(home, /سریال‌های محبوب TMDB/);
  assert.match(home, /سریال‌های برتر TMDB/);
});

test("SEO endpoints use the canonical production host", () => {
  for (const source of [sitemap, robots, layout]) {
    assert.match(source, /https:\/\/www\.filmtrack\.ir/);
    assert.doesNotMatch(source, /cine-?fan|vercel\.app/);
  }
  assert.match(robots, /"\/dashboard"/);
  assert.match(robots, /"\/api\/"/);
});

test("baseline security headers are version controlled", () => {
  assert.match(nextConfig, /poweredByHeader:\s*false/);
  assert.match(nextConfig, /X-Content-Type-Options/);
  assert.match(nextConfig, /X-Frame-Options/);
  assert.match(nextConfig, /Referrer-Policy/);
  assert.match(nextConfig, /Permissions-Policy/);
});

test("README labels beta and clone instructions accurately", () => {
  assert.match(readme, /public beta/);
  assert.match(
    readme,
    /git clone https:\/\/github\.com\/AmirMotefaker\/FilmTrack\.git\s+cd FilmTrack/,
  );
  assert.doesNotMatch(readme, /\.gitcd FilmTrack/);
});
