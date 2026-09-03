import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync("src/lib/m4/taste-match.ts", "utf8");
const page = fs.readFileSync("src/app/u/[username]/taste/page.tsx", "utf8");
const followButton = fs.readFileSync("src/components/CommunityFollowButton.tsx", "utf8");

function compute(viewer, otherPublic) {
  const score = { dropped: 1, on_hold: 2, plan_to_watch: 3, watching: 4, completed: 5 };
  const key = (x) => `${x.titleType}:${x.titleId}`;
  const vm = new Map(viewer.map((x) => [key(x), x]));
  const om = new Map(otherPublic.map((x) => [key(x), x]));
  const shared = [...vm.entries()].filter(([k]) => om.has(k)).map(([k, mine]) => ({ mine, theirs: om.get(k) }));
  const agreement = shared.length ? shared.reduce((sum, { mine, theirs }) => sum + (1 - Math.abs(score[mine.status] - score[theirs.status]) / 4), 0) / shared.length : 0;
  const coverage = Math.min(1, shared.length / Math.max(1, Math.min(vm.size, om.size)));
  const confidence = Math.min(1, shared.length / 8);
  const matchPercent = shared.length < 3 ? null : Math.round(Math.max(0, Math.min(1, agreement * .65 + coverage * .35)) * (.6 + confidence * .4) * 100);
  const recommendations = otherPublic.filter((x) => !vm.has(key(x)) && ["completed", "watching"].includes(x.status));
  return { matchPercent, shared: shared.length, recommendations };
}

test("taste match requires at least three shared titles", () => {
  const result = compute(
    [{ titleId: 1, titleType: "movie", status: "completed" }, { titleId: 2, titleType: "movie", status: "completed" }],
    [{ titleId: 1, titleType: "movie", status: "completed" }, { titleId: 2, titleType: "movie", status: "watching" }],
  );
  assert.equal(result.matchPercent, null);
});

test("aligned watch behavior yields a strong deterministic match", () => {
  const viewer = [1,2,3,4].map((id) => ({ titleId: id, titleType: "movie", status: "completed" }));
  const other = [1,2,3,4].map((id) => ({ titleId: id, titleType: "movie", status: "completed" }));
  const result = compute(viewer, other);
  assert.ok(result.matchPercent >= 75);
});

test("recommendations only use unseen completed/watching public titles", () => {
  const viewer = [1,2,3].map((id) => ({ titleId: id, titleType: "movie", status: "completed" }));
  const other = [
    ...viewer,
    { titleId: 4, titleType: "movie", status: "completed" },
    { titleId: 5, titleType: "tv", status: "watching" },
    { titleId: 6, titleType: "movie", status: "plan_to_watch" },
  ];
  const result = compute(viewer, other);
  assert.deepEqual(result.recommendations.map((x) => x.titleId), [4, 5]);
});

test("cross-user route queries only explicitly public list rows", () => {
  assert.match(page, /\.eq\("is_public", true\)/);
  assert.doesNotMatch(page, /user_ratings/);
  assert.doesNotMatch(page, /diary_entries/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
});

test("public profile follow control exposes Taste Match navigation", () => {
  assert.match(followButton, /\/taste/);
  assert.match(followButton, /Taste Match/);
  assert.match(source, /shared\.length < 3/);
});
