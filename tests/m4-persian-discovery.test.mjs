import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const parser = await readFile(new URL("../src/lib/m4/discovery.ts", import.meta.url), "utf8");
const page = await readFile(new URL("../src/app/discover/page.tsx", import.meta.url), "utf8");
const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

test("Persian discovery remains deterministic and zero-cost", () => {
  assert.match(parser, /parsePersianDiscoveryIntent/);
  assert.match(parser, /buildTmdbDiscoverPath/);
  assert.match(parser, /غمگین/);
  assert.match(parser, /امیدبخش/);
  assert.match(parser, /معمایی/);
  assert.match(parser, /کوتاه/);
  assert.doesNotMatch(parser, /openai|gemini|groq|anthropic/i);
});

test("discover page is transparent, shareable and FilmTrack-first", () => {
  assert.match(page, /action="\/discover"/);
  assert.match(page, /name="q"/);
  assert.match(page, /rule-based/);
  assert.match(page, /برداشت FilmTrack از درخواست تو/);
  assert.match(page, /TMDB/);
  assert.doesNotMatch(page, /هوش مصنوعی[^»]*می‌فهمد/);
});

test("strict suite includes Persian discovery regression", () => {
  assert.match(pkg.scripts.test, /tests\/m4-persian-discovery\.test\.mjs/);
});
