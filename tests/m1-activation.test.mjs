import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const onboarding = await readFile(
  new URL("../src/components/OnboardingActivation.tsx", import.meta.url),
  "utf8",
);
const onboardingPage = await readFile(
  new URL("../src/app/onboarding/page.tsx", import.meta.url),
  "utf8",
);
const authPage = await readFile(
  new URL("../src/app/auth/page.tsx", import.meta.url),
  "utf8",
);
const actions = await readFile(
  new URL("../src/components/ActionButtons.tsx", import.meta.url),
  "utf8",
);
const watchlist = await readFile(
  new URL("../src/lib/watchlist-client.ts", import.meta.url),
  "utf8",
);

test("onboarding requires auth and targets three titles", () => {
  assert.match(onboardingPage, /redirect\("\/auth"\)/);
  assert.match(onboarding, /ACTIVATION_TARGET = 3/);
  assert.match(onboarding, /source: "onboarding"/);
  assert.match(onboarding, /"search_submitted"/);
  assert.match(onboarding, /"watchlist_added"/);
});

test("signup routes authenticated users into onboarding", () => {
  assert.match(authPage, /"signup_started"/);
  assert.match(authPage, /"signup_completed"/);
  assert.match(authPage, /router\.push\("\/onboarding"\)/);
  assert.match(authPage, /redirectTo: `\$\{window\.location\.origin\}\/onboarding`/);
});

test("M1 exposes the five canonical watch states through one writer", () => {
  for (const status of [
    "plan_to_watch",
    "watching",
    "completed",
    "on_hold",
    "dropped",
  ]) {
    assert.match(actions, new RegExp(`status: "${status}"`));
  }

  assert.match(actions, /saveWatchStatus/);
  assert.match(watchlist, /writeUserListEntry/);
  assert.doesNotMatch(watchlist, /UNIQUE_VIOLATION/);
});
