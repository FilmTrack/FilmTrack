import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL(
    "../supabase/migrations/20260830115500_m2_rating_diary_foundation.sql",
    import.meta.url,
  ),
  "utf8",
);
const events = await readFile(
  new URL("../src/lib/product-events.ts", import.meta.url),
  "utf8",
);
const runbook = await readFile(
  new URL("../docs/audits/M2-RATING-DIARY-MIGRATION-RUNBOOK.md", import.meta.url),
  "utf8",
);

test("M2 rating identity is canonical and bounded", () => {
  assert.match(migration, /create table if not exists public\.user_ratings/i);
  assert.match(
    migration,
    /unique\s*\(user_id,\s*title_id,\s*title_type\)/i,
  );
  assert.match(migration, /rating_10 between 1 and 10/i);
  assert.match(migration, /title_type in \('movie', 'tv'\)/i);
});

test("M2 diary preserves multiple watches and private ownership", () => {
  assert.match(migration, /create table if not exists public\.diary_entries/i);
  assert.doesNotMatch(
    migration,
    /unique\s*\(user_id,\s*title_id,\s*title_type\)/i,
  );
  assert.match(
    migration,
    /diary_entries_user_title_watched_on_idx[\s\S]*user_id, title_id, title_type, watched_on desc/i,
  );
  assert.match(
    migration,
    /create policy "Users can view their own diary"[\s\S]*to authenticated[\s\S]*auth\.uid\(\)\) = user_id/i,
  );
  assert.doesNotMatch(migration, /grant\s+select[\s\S]*diary_entries[\s\S]*to anon/i);
});

test("M2 tables avoid raw email PII and use owner-only RLS", () => {
  assert.doesNotMatch(migration, /user_email|email_address|raw_email/i);
  assert.match(migration, /alter table public\.user_ratings enable row level security/i);
  assert.match(migration, /alter table public\.diary_entries enable row level security/i);
  assert.match(migration, /revoke all privileges on table public\.user_ratings from anon, authenticated/i);
  assert.match(migration, /revoke all privileges on table public\.diary_entries from anon, authenticated/i);
});

test("M2 analytics vocabulary is explicit and non-PII", () => {
  for (const event of [
    "rating_created",
    "rating_updated",
    "rating_removed",
    "diary_entry_created",
    "diary_entry_removed",
    "rewatch_recorded",
  ]) {
    assert.match(events, new RegExp(`"${event}"`));
  }
  assert.doesNotMatch(events, /user_email|email_address/);
});

test("M2 production migration remains separately gated", () => {
  assert.match(runbook, /does \*\*not\*\* authorize applying it to production/i);
  assert.match(runbook, /separate explicit approval/i);
  assert.match(runbook, /Preview performs \*\*zero writes\*\*/i);
  assert.match(runbook, /owner\/other-user\/anonymous authorization probes/i);
});
