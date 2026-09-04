import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const historyPage = fs.readFileSync(path.join(root, "src/app/dashboard/history/page.tsx"), "utf8");
const readiness = fs.readFileSync(path.join(root, "src/lib/m2/readiness.ts"), "utf8");

test("personal history stays behind the existing M2 readiness gate", () => {
  assert.match(historyPage, /isRatingDiaryRuntimeEnabled\(\)/);
  assert.match(historyPage, /if \(!enabled\)/);
  assert.match(historyPage, /user_ratings/);
  assert.match(historyPage, /diary_entries/);
  assert.ok(
    historyPage.indexOf("if (!enabled)") < historyPage.indexOf('.from("user_ratings")'),
    "database reads must remain after the disabled-state early return",
  );
  assert.match(readiness, /NEXT_PUBLIC_FILMTRACK_M2_RATING_DIARY_ENABLED/);
});

test("personal history is authenticated and owner scoped", () => {
  assert.match(historyPage, /if \(!userId\) redirect\("\/auth"\)/);
  assert.match(historyPage, /\.eq\("user_id", userId\)/);
  assert.doesNotMatch(historyPage, /community_profiles|community_follows/);
});

test("rewatches are derived from repeated canonical diary identities", () => {
  assert.match(historyPage, /titleKey\(row\.title_id, row\.title_type\)/);
  assert.match(historyPage, /watchCounts\.set\(key, \(watchCounts\.get\(key\) \|\| 0\) \+ 1\)/);
  assert.match(historyPage, /Math\.max\(0, count - 1\)/);
  assert.match(historyPage, /Rewatch/);
});

test("FilmTrack personal ratings are explicitly separated from TMDB aggregate ratings", () => {
  assert.match(historyPage, /امتیاز شخصی FilmTrack؛ مستقل از امتیاز تجمیعی TMDB/);
  assert.match(historyPage, /rating_10/);
});

test("history surface includes mobile-safe empty and read-error states without writes", () => {
  assert.match(historyPage, /هنوز امتیازی ثبت نکرده‌ای/);
  assert.match(historyPage, /دفترچه‌ات هنوز خالی است/);
  assert.match(historyPage, /خواندن تاریخچه موقتاً با خطا روبه‌رو شد/);
  assert.doesNotMatch(historyPage, /\.insert\(|\.upsert\(|\.update\(|\.delete\(/);
});
