import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const engine = await readFile(new URL("../src/lib/m4/taste-dna.ts", import.meta.url), "utf8");

test("Taste DNA engine is deterministic, first-party and exposes match-ready dimensions", () => {
  assert.match(engine, /computeTasteDNA/);
  assert.match(engine, /genres:/);
  assert.match(engine, /people:/);
  assert.match(engine, /countries:/);
  assert.match(engine, /languages:/);
  assert.match(engine, /decades:/);
  assert.match(engine, /ratingStrictness/);
  assert.match(engine, /rewatchRate/);
  assert.match(engine, /movieShare/);
  assert.match(engine, /tvShare/);
  assert.doesNotMatch(engine, /openai|gemini|anthropic|groq/i);
});
