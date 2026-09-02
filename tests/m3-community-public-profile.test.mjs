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
const commentsSection = await readFile(
  new URL("../src/components/CommentsSection.tsx", import.meta.url),
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
const dataBoundaryMigration = await readFile(
  new URL("../supabase/migrations/20260819094500_m0_data_boundary_foundation.sql", import.meta.url),
  "utf8",
);
const ratingDiaryMigration = await readFile(
  new URL("../supabase/migrations/20260830115500_m2_rating_diary_foundation.sql", import.meta.url),
  "utf8",
);
const communityMigration = await readFile(
  new URL("../supabase/migrations/20260901143000_m3_community_identity_foundation.sql", import.meta.url),
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

test("M3 mutual relationship discovery stays participant-scoped", () => {
  assert.match(followButton, /getCommunityRelationship\(username\)/);
  assert.match(followButton, /این عضو هم شما را دنبال می‌کند/);
  assert.match(followClient, /\.eq\("follower_user_id", target\.user_id\)/);
  assert.match(followClient, /\.eq\("followed_user_id", user\.id\)/);
  assert.match(
    communityMigration,
    /create policy "community_follows_select_participant"[\s\S]*follower_user_id[\s\S]*followed_user_id/i,
  );
});

test("M3 activity surface reads only explicitly public user-list rows", () => {
  assert.match(publicProfile, /\.from\("user_lists"\)/);
  assert.match(publicProfile, /\.eq\("user_id", profile\.user_id\)/);
  assert.match(publicProfile, /\.eq\("is_public", true\)/);
  assert.match(publicProfile, /\.limit\(12\)/);
  assert.match(listVisibilityMigration, /using \(is_public = true\)/i);
});

test("M3 public comment activity uses the existing public comment boundary", () => {
  assert.match(publicProfile, /\.from\("comments"\)/);
  assert.match(publicProfile, /\.select\("id,title_id,title_type,content,is_spoiler,created_at"\)/);
  assert.match(publicProfile, /\.limit\(8\)/);
  assert.match(dataBoundaryMigration, /create policy "Anyone can view comments"[\s\S]*using \(true\)/i);
});

test("M3 public comment activity never reveals spoiler text in the profile summary", () => {
  assert.match(publicProfile, /comment\.is_spoiler/);
  assert.match(publicProfile, /این نظر حاوی اسپویلر است/);
});

test("title comments link only public community identities and stay runtime gated", () => {
  assert.match(commentsSection, /isCommunityRuntimeEnabled\(\)/);
  assert.match(commentsSection, /\.from\("community_profiles"\)/);
  assert.match(commentsSection, /\.eq\("visibility", "public"\)/);
  assert.match(commentsSection, /href=\{`\/u\/\$\{author\.username\}`\}/);
  assert.match(commentsSection, /کاربر FilmTrack/);
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
