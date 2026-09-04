import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync("src/app/dashboard/today/page.tsx", "utf8");

test("Today is authenticated and private", () => {
  assert.match(source, /getClaims\(\)/);
  assert.match(source, /redirect\("\/auth"\)/);
  assert.match(source, /robots:\s*\{ index: false, follow: false \}/);
  assert.match(source, /\.eq\("user_id", userId\)/);
});

test("Today covers cold start and established daily habit modules", () => {
  assert.match(source, /isColdStart/);
  assert.match(source, /ادامه تماشا/);
  assert.match(source, /قسمت‌های نزدیک/);
  assert.match(source, /dashboard\/recommendations/);
  assert.match(source, /dashboard\/stats/);
  assert.match(source, /dashboard\/notifications/);
  assert.match(source, /dashboard\/history/);
});

test("Today reuses personal calendar and only tracks watching TV for upcoming episodes", () => {
  assert.match(source, /groupPersonalCalendar/);
  assert.match(source, /row\.status === "watching"/);
  assert.match(source, /row\.title_type === "tv"/);
  assert.match(source, /next_episode_to_air/);
  assert.match(source, /language=fa-IR/);
});
