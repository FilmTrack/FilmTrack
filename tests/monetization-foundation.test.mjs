import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [plusPage, navbar, footer, sitemap, strategy] = await Promise.all([
  read("src/app/plus/page.tsx"),
  read("src/components/Navbar.tsx"),
  read("src/components/Footer.tsx"),
  read("src/app/sitemap.ts"),
  read("docs/product/MONETIZATION-STRATEGY.md"),
]);

test("FilmTrack Plus is discoverable without activating checkout", () => {
  assert.match(navbar, /href="\/plus"/);
  assert.match(footer, /href="\/plus"/);
  assert.match(sitemap, /\$\{baseUrl\}\/plus/);
  assert.match(plusPage, /Checkout هنوز فعال نیست/);
});

test("monetization contract preserves the useful free tracking core", () => {
  assert.match(plusPage, /هستهٔ ردیابی/);
  assert.match(strategy, /must not monetize by weakening the core tracking experience/i);
  assert.match(strategy, /Basic movie\/series tracking/);
  assert.match(strategy, /Data export or deletion/);
});

test("monetization strategy rejects sale of personal user data", () => {
  assert.match(plusPage, /دادهٔ شخصی کاربران را.*نمی‌فروشد/);
  assert.match(strategy, /No sale of personal data/);
  assert.match(strategy, /Never sell:/);
});

test("checkout remains gated on retention and privacy readiness", () => {
  assert.match(strategy, /WAT is stable or improving for four consecutive weeks/);
  assert.match(strategy, /reliable D30 retention baseline/);
  assert.match(strategy, /Payment support, refunds, and failure handling/);
});
