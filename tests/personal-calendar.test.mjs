import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const helper = readFileSync("src/lib/personal-calendar.ts", "utf8");
const page = readFileSync("src/app/dashboard/calendar/page.tsx", "utf8");
const navbar = readFileSync("src/components/Navbar.tsx", "utf8");

test("personal calendar groups today, week and later deterministically", () => {
  assert.match(helper, /groupPersonalCalendar/);
  assert.match(helper, /daysAway === 0/);
  assert.match(helper, /daysAway <= 7/);
  assert.match(helper, /Asia\/Tehran/);
});

test("calendar page is private, noindex and uses tracked TV titles", () => {
  assert.match(page, /redirect\("\/auth"\)/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(page, /from\("user_lists"\)/);
  assert.match(page, /eq\("title_type", "tv"\)/);
  assert.match(page, /eq\("status", "watching"\)/);
  assert.match(page, /next_episode_to_air/);
});

test("calendar has resilient empty/error states and is discoverable", () => {
  assert.match(page, /trackingError/);
  assert.match(page, /هنوز سریالی با وضعیت «در حال تماشا» نداری/);
  assert.match(page, /فعلاً قسمت آینده‌ای ثبت نشده است/);
  assert.match(navbar, /href="\/dashboard\/calendar"/);
  assert.match(navbar, /تقویم شخصی من/);
});
