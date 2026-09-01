import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contract = await readFile(
  new URL("../src/lib/community-identity.ts", import.meta.url),
  "utf8",
);
const migration = await readFile(
  new URL(
    "../supabase/migrations/20260901143000_m3_community_identity_foundation.sql",
    import.meta.url,
  ),
  "utf8",
);

test("M3 community identity never exposes auth email", () => {
  assert.doesNotMatch(contract, /email|user_email|email_address/i);
  assert.doesNotMatch(migration, /user_email|email_address|raw_email/i);
  assert.match(contract, /PublicCommunityProfile/);
  assert.doesNotMatch(
    contract.match(/export type PublicCommunityProfile[\s\S]*?;/)?.[0] ?? "",
    /userId/,
  );
});

test("M3 profile limits stay aligned between runtime and database", () => {
  assert.match(contract, /COMMUNITY_USERNAME_MIN_LENGTH = 3/);
  assert.match(contract, /COMMUNITY_USERNAME_MAX_LENGTH = 24/);
  assert.match(contract, /COMMUNITY_DISPLAY_NAME_MAX_LENGTH = 48/);
  assert.match(contract, /COMMUNITY_BIO_MAX_LENGTH = 240/);

  assert.match(migration, /\^\[a-z0-9_\]\{3,24\}\$/);
  assert.match(migration, /char_length\(display_name\) between 1 and 48/i);
  assert.match(migration, /char_length\(bio\) <= 240/i);
});

test("M3 profiles are private by default and owner-controlled", () => {
  assert.match(migration, /visibility text not null default 'private'/i);
  assert.match(migration, /alter table public\.community_profiles enable row level security/i);
  assert.match(
    migration,
    /create policy "community_profiles_update_owner"[\s\S]*auth\.uid\(\)\) = user_id/i,
  );
  assert.doesNotMatch(migration, /grant\s+select[\s\S]*community_profiles[\s\S]*to anon/i);
});

test("M3 follow graph is duplicate-safe, no-self-follow, and participant-scoped", () => {
  assert.match(
    migration,
    /primary key \(follower_user_id, followed_user_id\)/i,
  );
  assert.match(
    migration,
    /check \(follower_user_id <> followed_user_id\)/i,
  );
  assert.match(
    migration,
    /create policy "community_follows_select_participant"[\s\S]*follower_user_id[\s\S]*followed_user_id/i,
  );
  assert.match(
    migration,
    /create policy "community_follows_insert_follower"[\s\S]*auth\.uid\(\)\) = follower_user_id/i,
  );
});

test("M3 public projection requires explicit public visibility", () => {
  assert.match(
    contract,
    /if \(profile\.visibility !== "public"\) return null;/,
  );
  assert.match(
    contract,
    /return input\.visibility === "public";/,
  );
});
