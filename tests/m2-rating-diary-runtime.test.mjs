import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readiness = await readFile(
  new URL("../src/lib/m2/readiness.ts", import.meta.url),
  "utf8",
);
const runtime = await readFile(
  new URL("../src/lib/m2/rating-diary-client.ts", import.meta.url),
  "utf8",
);
const panel = await readFile(
  new URL("../src/components/RatingDiaryPanel.tsx", import.meta.url),
  "utf8",
);
const titlePage = await readFile(
  new URL("../src/app/title/[id]/page.tsx", import.meta.url),
  "utf8",
);

test("M2 runtime is disabled unless explicitly activated", () => {
  assert.match(
    readiness,
    /NEXT_PUBLIC_FILMTRACK_M2_RATING_DIARY_ENABLED\s*===\s*"true"/,
  );
  assert.doesNotMatch(readiness, /!==\s*"false"|\|\|\s*true/);
});

test("rating and diary mutations stop before Supabase access when gate is inactive", () => {
  const gateIndex = runtime.indexOf("if (!isRatingDiaryRuntimeEnabled())");
  const clientIndex = runtime.indexOf("const supabase = createClient()");

  assert.ok(gateIndex >= 0, "runtime gate must exist");
  assert.ok(clientIndex > gateIndex, "gate must execute before Supabase client creation");
  assert.match(runtime, /reason:\s*"runtime_unavailable"/);
});

test("rating writer preserves canonical identity and bounded storage scale", () => {
  assert.match(runtime, /rating10\s*<\s*1/);
  assert.match(runtime, /rating10\s*>\s*10/);
  assert.match(runtime, /from\("user_ratings"\)\.upsert/);
  assert.match(runtime, /onConflict:\s*"user_id,title_id,title_type"/);
});

test("diary writer inserts repeatable watch rows and owner-scopes deletion", () => {
  assert.match(runtime, /from\("diary_entries"\)\.insert/);
  assert.doesNotMatch(runtime, /diary_entries[\s\S]*onConflict/);
  assert.match(runtime, /\.eq\("user_id",\s*runtime\.userId\)/);
});

test("mobile-first panel exposes a safe unavailable state", () => {
  assert.match(panel, /if \(!enabled\)/);
  assert.match(panel, /پس از تأیید نهایی پایگاه‌داده فعال می‌شود/);
  assert.match(panel, /grid-cols-5[\s\S]*sm:grid-cols-10/);
  assert.match(panel, /min-h-11/);
});

test("unapplied M2 tables are not wired into the production title route yet", () => {
  assert.doesNotMatch(titlePage, /RatingDiaryPanel/);
  assert.doesNotMatch(titlePage, /user_ratings|diary_entries/);
});
