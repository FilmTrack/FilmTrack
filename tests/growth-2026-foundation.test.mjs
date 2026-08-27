import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [layout, footer, robots, navbar, liveSearch, packageJsonRaw] = await Promise.all([
  read("src/app/layout.tsx"),
  read("src/components/Footer.tsx"),
  read("src/app/robots.ts"),
  read("src/components/Navbar.tsx"),
  read("src/components/LiveSearch.tsx"),
  read("package.json"),
]);

const packageJson = JSON.parse(packageJsonRaw);

test("public SEO metadata declares canonical FilmTrack entity signals", () => {
  assert.match(layout, /alternates:\s*\{[\s\S]*canonical:\s*"\/"/);
  assert.match(layout, /"@type":\s*"WebSite"/);
  assert.match(layout, /"@type":\s*"Organization"/);
  assert.match(layout, /SearchAction/);
  assert.match(layout, /https:\/\/www\.filmtrack\.ir/);
});

test("AI search crawler can access public pages without exposing private surfaces", () => {
  assert.match(robots, /userAgent:\s*"OAI-SearchBot"/);
  assert.match(robots, /"\/dashboard"/);
  assert.match(robots, /"\/auth"/);
  assert.match(robots, /"\/api\/"/);
});

test("footer attribution links Amir Motefaker to the canonical personal site", () => {
  assert.match(footer, /درست شده با عشق ❤️ برای ایرانیان توسط/);
  assert.match(footer, /href="https:\/\/amirmotefaker\.ir"/);
  assert.doesNotMatch(
    footer,
    /href="https:\/\/github\.com\/AmirMotefaker"[\s\S]*>\s*امیر متفکر\s*<\/a>/,
  );
});

test("mobile navigation and search remain available below desktop breakpoint", () => {
  assert.match(navbar, /md:hidden/);
  assert.match(navbar, /باز کردن منوی FilmTrack/);
  assert.match(navbar, /href="\/movies"/);
  assert.match(navbar, /href="\/shows"/);
  assert.match(navbar, /href="\/genres"/);
  assert.match(navbar, /href="\/calendar"/);
  assert.match(liveSearch, /w-full md:w-64/);
  assert.match(liveSearch, /min-h-16/);
});

test("mobile application foundation remains an active dependency", () => {
  assert.ok(packageJson.dependencies["@capacitor/core"]);
  assert.ok(packageJson.dependencies["@capacitor/android"]);
  assert.ok(packageJson.dependencies["@capacitor/cli"]);
});
