import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dashboard = await readFile(
  new URL("../src/app/dashboard/page.tsx", import.meta.url),
  "utf8",
);

test("dashboard keeps M3 reads behind the community runtime gate", () => {
  assert.match(dashboard, /isCommunityRuntimeEnabled\(\)/);

  const gate = dashboard.indexOf("if (communityEnabled)");
  const profileQuery = dashboard.indexOf('.from("community_profiles")');
  assert.ok(gate > -1);
  assert.ok(profileQuery > gate);
});

test("dashboard offers onboarding when the signed-in user has no community profile", () => {
  assert.match(dashboard, /communityProfile \?/);
  assert.match(dashboard, /پروفایل اجتماعی FilmTrack را بساز/);
  assert.match(dashboard, /href="\/dashboard\/profile"/);
  assert.match(dashboard, /ساخت پروفایل/);
});

test("dashboard exposes discovery and private network only when community is available", () => {
  assert.match(dashboard, /href="\/community"/);
  assert.match(dashboard, /href="\/dashboard\/community"/);
  assert.match(dashboard, /کشف اعضا/);
  assert.match(dashboard, /شبکه من/);
});

test("dashboard public-profile link is username-based and visibility-gated", () => {
  assert.match(dashboard, /communityProfile\?\.visibility === "public"/);
  assert.match(dashboard, /href=\{`\/u\/\$\{encodeURIComponent\(communityProfile\.username\)\}`\}/);
  assert.doesNotMatch(dashboard, /href=\{`\/profile\/\$\{userId\}`\}/);
});
