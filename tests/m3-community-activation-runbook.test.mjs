import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("../supabase/migrations/20260901143000_m3_community_identity_foundation.sql", import.meta.url),
  "utf8",
);
const readiness = await readFile(
  new URL("../src/lib/m3/readiness.ts", import.meta.url),
  "utf8",
);
const runbook = await readFile(
  new URL("../docs/infra/m3-community-activation-runbook.md", import.meta.url),
  "utf8",
);

test("M3 activation remains exact-flag gated", () => {
  assert.match(readiness, /NEXT_PUBLIC_FILMTRACK_M3_COMMUNITY_ENABLED/);
  assert.match(readiness, /=== "true"/);
  assert.match(runbook, /feature flag OFF/i);
});

test("M3 migration preserves canonical follow schema and privacy boundaries", () => {
  assert.match(migration, /follower_user_id uuid not null/);
  assert.match(migration, /followed_user_id uuid not null/);
  assert.match(migration, /primary key \(follower_user_id, followed_user_id\)/);
  assert.match(migration, /follower_user_id <> followed_user_id/);
  assert.match(migration, /community_follows_select_participant/);
  assert.match(migration, /revoke all privileges on table public\.community_follows from anon, authenticated/);
});

test("M3 profiles stay private-by-default and anonymous reads stay closed", () => {
  assert.match(migration, /visibility text not null default 'private'/);
  assert.match(migration, /community_profiles_select_authenticated/);
  assert.match(migration, /revoke all privileges on table public\.community_profiles from anon, authenticated/);
  assert.doesNotMatch(migration, /to anon\s+using/i);
});

test("M3 operational rollback disables runtime without destructive schema removal", () => {
  assert.match(runbook, /primary rollback is runtime isolation/i);
  assert.match(runbook, /Leave `community_profiles` and `community_follows` intact/);
  assert.match(runbook, /Do not drop M3 tables as an emergency rollback/);
});

test("M3 activation runbook requires verification before enabling runtime", () => {
  const verifyIndex = runbook.indexOf("Run the read-only verification queries");
  const enableIndex = runbook.indexOf("NEXT_PUBLIC_FILMTRACK_M3_COMMUNITY_ENABLED=true");
  assert.ok(verifyIndex > -1);
  assert.ok(enableIndex > verifyIndex);
  assert.match(runbook, /Strict Quality Gates/);
  assert.match(runbook, /smoke test/i);
});
