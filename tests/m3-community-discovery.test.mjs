import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const discoveryPage = await readFile(
  new URL("../src/app/community/page.tsx", import.meta.url),
  "utf8",
);
const profileSettings = await readFile(
  new URL("../src/app/dashboard/profile/page.tsx", import.meta.url),
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

test("M3 discovery is authenticated and runtime-gated before profile queries", () => {
  assert.match(discoveryPage, /if \(!viewerUserId\) redirect\("\/auth"\)/);
  assert.match(discoveryPage, /isCommunityRuntimeEnabled\(\)/);

  const runtimeGate = discoveryPage.indexOf("if (!enabled)");
  const profileQuery = discoveryPage.indexOf('.from("community_profiles")');
  assert.ok(runtimeGate > -1);
  assert.ok(profileQuery > runtimeGate);
});

test("M3 discovery only projects explicitly public profile fields", () => {
  const selects = [...discoveryPage.matchAll(/\.select\("([^"]+)"\)/g)].map(
    (match) => match[1],
  );

  assert.ok(selects.length >= 2);
  assert.ok(selects.every((projection) => projection === "username,display_name,bio"));
  assert.match(discoveryPage, /\.eq\("visibility", "public"\)/);
  assert.ok(selects.every((projection) => !/user_id|email|user_metadata/i.test(projection)));
});

test("M3 discovery searches username and display name with bounded input", () => {
  assert.match(discoveryPage, /sanitizeDiscoveryQuery/);
  assert.match(discoveryPage, /\.replace\(\/\[%_\(\),\]\/g, " "\)/);
  assert.match(discoveryPage, /\.slice\(0, 48\)/);
  assert.match(discoveryPage, /query\.length >= 2/);
  assert.match(discoveryPage, /\.ilike\("username", `%\$\{query\}%`\)/);
  assert.match(discoveryPage, /\.ilike\("display_name", `%\$\{query\}%`\)/);
});

test("M3 discovery links only by username and never exposes UUID routes", () => {
  assert.match(discoveryPage, /href=\{`\/u\/\$\{encodeURIComponent\(member\.username\)\}`\}/);
  assert.doesNotMatch(discoveryPage, /href=\{`[^`]*user_id/);
  assert.match(profileSettings, /href="\/community"/);
});

test("M3 discovery exposes direct follow controls without nesting them inside profile links", () => {
  assert.match(discoveryPage, /CommunityFollowButton/);
  assert.match(discoveryPage, /username=\{member\.username\}/);
  assert.match(discoveryPage, /compact/);
  assert.match(discoveryPage, /<article[\s\S]*<Link[\s\S]*<\/Link>[\s\S]*<CommunityFollowButton/);
});

test("M3 relationship hydration returns both forward and reverse participant-scoped state", () => {
  assert.match(followClient, /following: boolean; followsYou: boolean/);
  assert.match(followClient, /\.eq\("follower_user_id", user\.id\)/);
  assert.match(followClient, /\.eq\("followed_user_id", target\.user_id\)/);
  assert.match(followClient, /\.eq\("follower_user_id", target\.user_id\)/);
  assert.match(followClient, /\.eq\("followed_user_id", user\.id\)/);
  assert.match(followButton, /setFollowing\(result\.following\)/);
  assert.match(followButton, /setFollowsYou\(result\.followsYou\)/);
});
