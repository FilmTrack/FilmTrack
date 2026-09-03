import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const navbar = await readFile(new URL("../src/components/Navbar.tsx", import.meta.url), "utf8");
const discoverPage = await readFile(new URL("../src/app/discover/page.tsx", import.meta.url), "utf8");
const recommendationsPage = await readFile(new URL("../src/app/dashboard/recommendations/page.tsx", import.meta.url), "utf8");
const historyPage = await readFile(new URL("../src/app/dashboard/history/page.tsx", import.meta.url), "utf8");
const importPage = await readFile(new URL("../src/app/dashboard/import/page.tsx", import.meta.url), "utf8");

test("public Persian discovery is reachable from desktop and mobile navigation", () => {
  const discoverLinks = navbar.match(/href="\/discover"/g) || [];
  assert.ok(discoverLinks.length >= 2, "discover must be exposed in desktop and mobile navigation");
  assert.match(navbar, /کشف فارسی/);
  assert.match(discoverPage, /alternates: \{ canonical: "\/discover" \}/);
});

test("authenticated retention tools are not orphan routes", () => {
  assert.match(navbar, /href="\/dashboard\/recommendations"/);
  assert.match(navbar, /href="\/dashboard\/history"/);
  assert.match(navbar, /href="\/dashboard\/import"/);
  assert.match(navbar, /چی ببینم؟/);
  assert.match(navbar, /تاریخچه و امتیازها/);
  assert.match(navbar, /انتقال تاریخچه|انتقال از سرویس‌های دیگر/);
});

test("private retention surfaces remain authenticated or explicitly private", () => {
  assert.match(recommendationsPage, /if \(!userId\) redirect\("\/auth"\)/);
  assert.match(recommendationsPage, /robots: \{ index: false, follow: false \}/);
  assert.match(historyPage, /if \(!userId\) redirect\("\/auth"\)/);
  assert.match(importPage, /redirect\("\/auth"\)/);
});

test("mobile product navigation remains scroll-safe as feature count grows", () => {
  assert.match(navbar, /max-h-\[calc\(100vh-88px\)\]/);
  assert.match(navbar, /overflow-y-auto/);
});
