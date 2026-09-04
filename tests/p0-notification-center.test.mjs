import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const helper = fs.readFileSync("src/lib/notifications.ts", "utf8");
const page = fs.readFileSync("src/app/dashboard/notifications/page.tsx", "utf8");
const navbar = fs.readFileSync("src/components/Navbar.tsx", "utf8");

test("notification inbox has deterministic IDs and duplicate suppression", () => {
  assert.match(helper, /new Map/);
  assert.match(helper, /unique\.has\(id\)/);
  assert.match(helper, /season_premiere/);
  assert.match(helper, /new_episode/);
  assert.match(helper, /episodeNumber === 1/);
});

test("notification delivery adapter remains a zero-cost future boundary", () => {
  assert.match(helper, /NotificationDeliveryAdapter/);
  assert.doesNotMatch(helper, /resend|sendgrid|firebase|onesignal/i);
});

test("notification page is private and current-user scoped", () => {
  assert.match(page, /getClaims\(\)/);
  assert.match(page, /redirect\("\/auth"\)/);
  assert.match(page, /robots:\s*\{ index: false, follow: false \}/);
  assert.match(page, /\.eq\("user_id", userId\)/);
  assert.match(page, /\.eq\("status", "watching"\)/);
});

test("notification page is Persian-first and globally discoverable when signed in", () => {
  assert.match(page, /next_episode_to_air/);
  assert.match(page, /language=fa-IR/);
  assert.match(page, /formatPersianCalendarDate/);
  assert.match(page, /اعلان‌های من/);
  assert.match(navbar, /dashboard\/notifications/g);
});
