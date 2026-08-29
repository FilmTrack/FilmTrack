import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [titlePage, contract] = await Promise.all([
  readFile(new URL("../src/app/title/[id]/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../docs/seo/PHASE-C-2026.md", import.meta.url), "utf8"),
]);

test("Phase C keeps title pages as canonical entity surfaces", () => {
  assert.match(contract, /canonical entity surface/);
  assert.match(contract, /Genre pages are stable discovery hubs/);
  assert.match(contract, /link stuffing.*prohibited/i);
});

test("Phase C documents truthful image and AI citation contracts", () => {
  assert.match(contract, /descriptive alt text/);
  assert.match(contract, /Structured data must agree with visible content/);
  assert.match(contract, /must not publish fabricated reviews, ratings, availability/);
  assert.match(contract, /No hidden crawler-only or LLM-only claims/);
});

test("existing title page exposes visible identity-backed image alternatives", () => {
  assert.match(titlePage, /alt=\{`پوستر \$\{faTitle\}`\}/);
  assert.match(titlePage, /alt=\{member\.name\}/);
});

test("Phase C defines Search Console and mobile release measurement", () => {
  assert.match(contract, /Search Console/);
  assert.match(contract, /impressions, clicks and CTR/);
  assert.match(contract, /Core Web Vitals/);
  assert.match(contract, /common phone widths/);
});

test("Phase C preserves production safety boundaries", () => {
  assert.match(contract, /no database migration/i);
  assert.match(contract, /no changes to Supabase, authentication, payment, production domains/i);
});

test("title page links visible genres to canonical discovery hubs", () => {
  assert.match(titlePage, /href=\{`\/genre\/\$\{genre\.id\}`\}/);
  assert.match(titlePage, /aria-label="ژانرهای این عنوان"/);
  assert.match(titlePage, /focus-visible:ring-2/);
});

test("poster and backdrop semantics distinguish content from decoration", () => {
  assert.match(titlePage, /alt=\{`پوستر \$\{faTitle\}`\}/);
  assert.match(
    titlePage,
    /src=\{`https:\/\/image\.tmdb\.org\/t\/p\/original\$\{data\.backdrop_path\}`\}[\s\S]*?alt=""/,
  );
});

test("genre discovery remains human-visible rather than hidden SEO copy", () => {
  assert.doesNotMatch(titlePage, /display:\s*none|visibility:\s*hidden/);
  assert.match(titlePage, /\{genre\.name\}/);
});
