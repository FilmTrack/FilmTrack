import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [migration, searchRoute, publicProfile, dashboard, visibilityRoute, eventsRoute, observability] =
  await Promise.all([
    read("supabase/migrations/20260822093000_m0_privacy_visibility.sql"),
    read("src/app/api/search/route.ts"),
    read("src/app/profile/[userId]/page.tsx"),
    read("src/app/dashboard/page.tsx"),
    read("src/app/api/list-visibility/route.ts"),
    read("src/app/api/events/route.ts"),
    read("src/lib/observability.ts"),
  ]);

test("list privacy is explicit and defaults private", () => {
  assert.match(migration, /is_public boolean not null default false/);
  assert.match(migration, /using \(is_public = true\)/);
  assert.match(publicProfile, /\.eq\("is_public", true\)/);
  assert.match(dashboard, /ListVisibilityToggle/);
  assert.match(visibilityRoute, /\.eq\("user_id", userId\)/);
});

test("public search has rate limiting, cache policy and request correlation", () => {
  assert.match(searchRoute, /MAX_REQUESTS = 30/);
  assert.match(searchRoute, /status: 429/);
  assert.match(searchRoute, /Retry-After/);
  assert.match(searchRoute, /s-maxage=60/);
  assert.match(searchRoute, /X-Request-Id/);
  assert.match(searchRoute, /search\.completed/);
});

test("observability and product analytics reject obvious PII fields", () => {
  assert.match(observability, /service: "filmtrack-web"/);
  assert.match(observability, /JSON\.stringify/);
  assert.match(eventsRoute, /ALLOWED_EVENTS/);
  assert.match(eventsRoute, /email\|phone\|name\|token\|password\|secret/);
  assert.match(eventsRoute, /product\.event/);
  assert.match(eventsRoute, /status: 202/);
});
