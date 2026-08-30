import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const nextConfig = await readFile(
  new URL("../next.config.ts", import.meta.url),
  "utf8",
);
const qualityWorkflow = await readFile(
  new URL("../.github/workflows/quality-gates.yml", import.meta.url),
  "utf8",
);

test("package scripts expose every strict quality gate", () => {
  assert.equal(packageJson.scripts.lint, "eslint --max-warnings=0");
  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
  assert.equal(
    packageJson.scripts.test,
    "node --test tests/title-links.test.mjs tests/quality-config.test.mjs tests/m0-data-boundary.test.mjs tests/product-truth-seo.test.mjs tests/monetization-foundation.test.mjs tests/m0-closure.test.mjs tests/m1-activation.test.mjs tests/m1-user-list-writer.test.mjs tests/m1-bulk-add.test.mjs tests/m1-bulk-writer.test.mjs tests/m1-search-contract.test.mjs tests/growth-2026-foundation.test.mjs tests/production-seo-verification.test.mjs tests/seo-phase-b-entity-surfaces.test.mjs tests/seo-phase-c-discoverability.test.mjs",
  );
  assert.equal(
    packageJson.scripts.quality,
    "npm run lint && npm run typecheck && npm test && npm run build",
  );
  assert.equal(
    packageJson.scripts["verify:production-seo"],
    "node scripts/verify-production-seo.mjs",
  );
});

test("Next.js build cannot ignore TypeScript errors", () => {
  assert.doesNotMatch(nextConfig, /ignoreBuildErrors\s*:\s*true/);
});

test("pull-request workflow runs all strict gates", () => {
  for (const command of [
    "npm run lint",
    "npm run typecheck",
    "npm test",
    "npm run build",
  ]) {
    assert.match(qualityWorkflow, new RegExp(command.replaceAll(" ", "\\s+")));
  }
});
