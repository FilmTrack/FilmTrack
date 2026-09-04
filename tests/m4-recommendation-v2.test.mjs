import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

async function loadModule() {
  const source = await readFile(new URL("../src/lib/m4/recommendation-v2.ts", import.meta.url), "utf8");
  const transpiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(transpiled, { module: loaded, exports: loaded.exports, require: () => ({}) });
  return loaded.exports;
}

const dna = {
  genres: [{ label: "Drama", score: 10, count: 4 }, { label: "Mystery", score: 8, count: 3 }],
  people: [{ label: "A Director", score: 7, count: 2 }],
  countries: [{ label: "US", score: 4, count: 3 }],
  languages: [{ label: "EN", score: 4, count: 3 }],
  decades: [{ label: "2020s", score: 4, count: 3 }],
  averageRating: 8.1,
  ratingStrictness: "دست‌ودلباز",
  rewatchRate: 20,
  movieShare: 70,
  tvShare: 30,
  sampleSize: 8,
};

const candidates = [
  { titleId: 1, titleType: "movie", genres: ["Drama"], people: ["A Director"], countries: ["US"], languages: ["EN"], year: 2024, runtimeMinutes: 105, popularity: 100, voteAverage: 8.2 },
  { titleId: 2, titleType: "movie", genres: ["Comedy"], people: [], countries: ["FR"], languages: ["FR"], year: 1995, runtimeMinutes: 95, popularity: 80, voteAverage: 7.9 },
  { titleId: 3, titleType: "tv", genres: ["Mystery"], people: [], countries: ["US"], languages: ["EN"], year: 2023, episodeRuntimeMinutes: 42, popularity: 70, voteAverage: 8.0 },
];

test("familiar mode prefers strong Taste DNA affinity", async () => {
  const { rankContextualRecommendations } = await loadModule();
  const result = rankContextualRecommendations({ dna, candidates, context: { titleType: "movie", time: "standard", discovery: "familiar" } });
  assert.equal(result[0].titleId, 1);
  assert.ok(result[0].reasons.some((reason) => reason.includes("ژانر")));
});

test("context filters title type and rewards short episode runtime", async () => {
  const { rankContextualRecommendations } = await loadModule();
  const result = rankContextualRecommendations({ dna, candidates, context: { titleType: "tv", time: "short", discovery: "balanced" } });
  assert.deepEqual(result.map((item) => item.titleId), [3]);
  assert.ok(result[0].reasons.some((reason) => reason.includes("زمان")));
});

test("excluded titles never return", async () => {
  const { rankContextualRecommendations } = await loadModule();
  const result = rankContextualRecommendations({ dna, candidates, context: { titleType: "any", time: "any", discovery: "balanced" }, excludedKeys: new Set(["movie:1", "tv:3"]) });
  assert.deepEqual(result.map((item) => item.titleId), [2]);
});

test("explore mode gives a novelty path for off-pattern candidates", async () => {
  const { rankContextualRecommendations } = await loadModule();
  const result = rankContextualRecommendations({ dna, candidates, context: { titleType: "movie", time: "any", discovery: "explore" } });
  assert.ok(result.some((item) => item.titleId === 2 && item.reasons.some((reason) => reason.includes("تازه"))));
});

test("diversity pass caps a dominant primary genre", async () => {
  const { rankContextualRecommendations } = await loadModule();
  const manyDrama = Array.from({ length: 8 }, (_, index) => ({ titleId: 100 + index, titleType: "movie", genres: ["Drama"], people: [], countries: ["US"], languages: ["EN"], year: 2024, runtimeMinutes: 100, popularity: 100 - index, voteAverage: 8 - index / 10 }));
  const mixed = [{ titleId: 200, titleType: "movie", genres: ["Comedy"], people: [], countries: ["US"], languages: ["EN"], year: 2024, runtimeMinutes: 100, popularity: 30, voteAverage: 7.5 }];
  const result = rankContextualRecommendations({ dna, candidates: [...manyDrama, ...mixed], context: { titleType: "movie", time: "any", discovery: "balanced" }, limit: 4 });
  assert.ok(result.filter((item) => item.genres[0] === "Drama").length <= 2);
  assert.ok(result.some((item) => item.genres[0] === "Comedy"));
});
