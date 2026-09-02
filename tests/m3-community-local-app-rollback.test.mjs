import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readiness = readFileSync("src/lib/m3/readiness.ts", "utf8");
const discovery = readFileSync("src/app/community/page.tsx", "utf8");

test("M3 runtime is enabled only by the exact true flag", () => {
  assert.match(
    readiness,
    /process\.env\.NEXT_PUBLIC_FILMTRACK_M3_COMMUNITY_ENABLED\s*===\s*["']true["']/,
  );
});

test("disabled Community discovery returns before querying M3 tables", () => {
  const disabledGuard = discovery.indexOf("if (!enabled)");
  const firstCommunityQuery = discovery.indexOf('.from("community_profiles")');

  assert.notEqual(disabledGuard, -1);
  assert.notEqual(firstCommunityQuery, -1);
  assert.ok(
    disabledGuard < firstCommunityQuery,
    "Feature-flag disabled guard must occur before community_profiles query",
  );
});

test("disabled Community UI explicitly documents no M3 table query", () => {
  assert.match(discovery, /هیچ queryای به جدول‌های M3 انجام نمی‌دهد/);
});
