import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/20260903114000_account_privacy_self_delete.sql", "utf8");
const readiness = readFileSync("src/lib/account/readiness.ts", "utf8");
const client = readFileSync("src/lib/account/account-privacy-client.ts", "utf8");
const page = readFileSync("src/app/dashboard/account/page.tsx", "utf8");
const actions = readFileSync("src/components/AccountPrivacyActions.tsx", "utf8");
const navbar = readFileSync("src/components/Navbar.tsx", "utf8");

test("self-delete RPC is owner-only and hardened", () => {
  assert.match(migration, /delete_my_filmtrack_account\(\)/);
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path = ''/i);
  assert.match(migration, /caller_id uuid := auth\.uid\(\)/);
  assert.doesNotMatch(migration, /delete_my_filmtrack_account\([^)]*uuid/i);
  assert.match(migration, /delete from auth\.users where id = caller_id/i);
  assert.match(migration, /revoke all on function public\.delete_my_filmtrack_account\(\) from public/i);
  assert.match(migration, /grant execute on function public\.delete_my_filmtrack_account\(\) to authenticated/i);
});

test("account deletion is gated OFF by default", () => {
  assert.match(readiness, /NEXT_PUBLIC_FILMTRACK_ACCOUNT_DELETE_ENABLED/);
  assert.match(readiness, /=== "true"/);
  assert.match(client, /if \(!isAccountDeleteRuntimeEnabled\(\)\)/);
  assert.match(client, /rpc\("delete_my_filmtrack_account"\)/);
});

test("export uses signed-in RLS client and exposes no service role", () => {
  assert.match(client, /supabase\.auth\.getUser\(\)/);
  assert.match(client, /filmtrack-user-export-v1/);
  assert.match(client, /user_lists/);
  assert.match(client, /user_ratings/);
  assert.match(client, /diary_entries/);
  assert.match(client, /episode_progress/);
  assert.match(client, /community_reviews/);
  assert.doesNotMatch(client, /service[_-]?role/i);
});

test("privacy center is authenticated, noindex, discoverable and destructive action needs exact confirmation", () => {
  assert.match(page, /redirect\("\/auth"\)/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(actions, /const DELETE_CONFIRMATION = "حذف حساب من"/);
  assert.match(actions, /confirmation !== DELETE_CONFIRMATION/);
  assert.match(actions, /deleteEnabled/);
  assert.match(navbar, /href="\/dashboard\/account"/);
  assert.match(navbar, /حساب و حریم خصوصی/);
});
