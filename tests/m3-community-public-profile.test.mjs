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
