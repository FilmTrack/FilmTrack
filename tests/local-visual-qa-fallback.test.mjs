import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const demoCatalog = await readFile(new URL("../src/lib/demo-catalog.ts", import.meta.url), "utf8");
const moviesPage = await readFile(new URL("../src/app/movies/page.tsx", import.meta.url), "utf8");
const showsPage = await readFile(new URL("../src/app/shows/page.tsx", import.meta.url), "utf8");
const calendarPage = await readFile(new URL("../src/app/calendar/page.tsx", import.meta.url), "utf8");

test("visual QA fallback is explicitly disabled in production", () => {
  assert.match(demoCatalog, /process\.env\.NODE_ENV !== "production"/);
});

test("movies and shows use deterministic local visual QA data when live content is unavailable", () => {
  assert.match(moviesPage, /demoMovies/);
  assert.match(moviesPage, /isLocalVisualQa/);
  assert.match(showsPage, /demoShows/);
  assert.match(showsPage, /isLocalVisualQa/);
});

test("calendar has a deterministic local visual QA state without changing production behavior", () => {
  assert.match(calendarPage, /demoCalendarItems/);
  assert.match(calendarPage, /isLocalVisualQa/);
});
