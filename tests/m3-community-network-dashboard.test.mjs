import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const networkPage = await readFile(
  new URL("../src/app/dashboard/community/page.tsx", import.meta.url),
  "utf8",
);
const profilePage = await readFile(
  new URL("../src/app/dashboard/profile/page.tsx", import.meta.url),
  "utf8",
);
const migration = await readFile(
  new URL("../supabase/migrations/20260901143000_m3_community_identity_foundation.sql", import.meta.url),
  "utf8",
);

test("community network dashboard requires auth and runtime gate before M3 reads", () => {
  assert.match(networkPage, /if \(!userId\) redirect\("\/auth"\)/);
  assert.match(networkPage, /isCommunityRuntimeEnabled\(\)/);
  const disabledGate = networkPage.indexOf("if (!enabled)");
  const followQuery = networkPage.indexOf('.from("community_follows")');
  assert.ok(disabledGate > -1);
  assert.ok(followQuery > disabledGate);
});

test("community network dashboard reads only edges where the signed-in user participates", () => {
  assert.match(networkPage, /follower_user_id\.eq\.\$\{userId\},followed_user_id\.eq\.\$\{userId\}/);
  assert.match(networkPage, /\.limit\(100\)/);
  assert.match(
    migration,
    /create policy "community_follows_select_participant"[\s\S]*auth\.uid\(\)\) = follower_user_id[\s\S]*auth\.uid\(\)\) = followed_user_id/i,
  );
});

test("community network dashboard exposes only explicit public counterpart identities", () => {
  assert.match(networkPage, /\.from\("community_profiles"\)/);
  assert.match(networkPage, /\.in\("user_id", counterpartIds\)/);
  assert.match(networkPage, /\.eq\("visibility", "public"\)/);
  assert.match(networkPage, /عضو با پروفایل خصوصی/);
  assert.doesNotMatch(networkPage, /href=\{`\/u\/\$\{[^}]*user_id/);
});

test("profile settings link into the owner's private network surface", () => {
  assert.match(profilePage, /href="\/dashboard\/community"/);
  assert.match(profilePage, /شبکه من/);
});
