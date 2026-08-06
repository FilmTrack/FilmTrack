import assert from "node:assert/strict";
import test from "node:test";

import { getRottenTomatoesUrl } from "../src/lib/title-links.mjs";

test("builds a movie Rotten Tomatoes URL", () => {
  assert.equal(
    getRottenTomatoesUrl("The Godfather", "movie"),
    "https://www.rottentomatoes.com/m/the_godfather",
  );
});

test("builds a TV Rotten Tomatoes URL and removes punctuation", () => {
  assert.equal(
    getRottenTomatoesUrl("Schitt's Creek!", "tv"),
    "https://www.rottentomatoes.com/tv/schitts_creek",
  );
});

test("returns a safe fallback for an unusable title", () => {
  assert.equal(getRottenTomatoesUrl("   ", "movie"), "#");
  assert.equal(getRottenTomatoesUrl("!!!", "tv"), "#");
});
