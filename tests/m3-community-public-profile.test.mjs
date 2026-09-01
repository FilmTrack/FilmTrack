import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const publicProfile = await readFile(
  new URL("../src/app/u/[username]/page.tsx", import.meta.url),
  "utf8",
);
const followButton = await readFile(
  new URL("../src/components/CommunityFollowButton.tsx", import.meta.url),
  "utf8",
);
const followClient = await readFile(
  new URL("../src/lib/m3/community-follow-client.ts", import.meta.url),
  "utf8",
);
const listVisibilityMigration = await readFile(
  new URL("../supabase/migrations/20260822093000_m0_privacy_visibility.sql", import.meta.url),
  "utf8",
);
const ratingDiaryMigration = await readFile(
  new URL("../supabase/migrations/20260830115500_m2_rating_diary_foundation.sql", import.meta.url),
  "utf8",
);

test("M3 public community route is username-based and runtime-gated", () => {
  assert.match(publicProfile, /params: Promise<\{ username: string \}>/);
  assert.match(publicProfile, /isCommunityRuntimeEnabled\(\)/);
  assert.match(publicProfile, /\.eq\("username", username\)/);
  assert.match(publicProfile, /\.eq\("visibility", "public"\)/);
});

test("M3 public profile does not query community tables before auth when anonymous reads are disabled", () => {
  const authGate = publicProfile.indexOf("if (!viewerUserId)");
  const profileQuery = publicProfile.indexOf('.from("community_profiles")');

  assert.ok(authGate > -1);
  assert.ok(profileQuery > authGate);
});

test("M3 follow state uses the canonical follow schema", () => {
  assert.match(followClient, /follower_user_id/);
  assert.match(followClient, /followed_user_id/);
  assert.doesNotMatch(followClient, /\bfollower_id\b/);
  assert.doesNotMatch(followClient, /\bfollowing_id\b/);

  assert.match(publicProfile, /\.eq\("follower_user_id", viewerUserId\)/);
  assert.match(publicProfile, /\.eq\("followed_user_id", profile\.user_id\)/);
});

test("M3 public profile exposes a client follow control with initial server state", () => {
  assert.match(publicProfile, /CommunityFollowButton/);
  assert.match(publicProfile, /initialFollowing=\{following\}/);
  assert.match(followButton, /setCommunityFollow\(username, nextFollowing\)/);
  assert.match(followButton, /aria-pressed=\{following\}/);
});

test("M3 activity surface reads only explicitly public user-list rows", () => {
  assert.match(publicProfile, /\.from\("user_lists"\)/);
  assert.match(publicProfile, /\.eq\("user_id", profile\.user_id\)/);
  assert.match(publicProfile, /\.eq\("is_public", true\)/);
  assert.match(publicProfile, /\.limit\(12\)/);
  assert.match(listVisibilityMigration, /using \(is_public = true\)/i);
});

test("M3 activity surface preserves owner-only rating and diary privacy", () => {
  assert.doesNotMatch(publicProfile, /\.from\("user_ratings"\)/);
  assert.doesNotMatch(publicProfile, /\.from\("diary_entries"\)/);
  assert.match(
    ratingDiaryMigration,
    /create policy "Users can view their own ratings"[\s\S]*auth\.uid\(\)\) = user_id/i,
  );
  assert.match(
    ratingDiaryMigration,
    /create policy "Users can view their own diary"[\s\S]*auth\.uid\(\)\) = user_id/i,
  );
});
