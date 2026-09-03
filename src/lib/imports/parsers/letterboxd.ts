import { letterboxdAdapter } from "../providers/letterboxd";
import { csvObjects } from "./csv";
import {
  normalizeText,
  numericOrUndefined,
  type ImportParseResult,
} from "./types";

export function parseLetterboxdCsv(
  content: string,
): ImportParseResult {
  const rows = csvObjects(content);

  const records = rows
    .map((row) =>
      letterboxdAdapter.normalize({
        uri: normalizeText(row.LetterboxdURI ?? row.URI),
        name: normalizeText(row.Name ?? row.Title),
        year: numericOrUndefined(row.Year),
        tmdbId: numericOrUndefined(
          row.TMDBID ?? row.tmdb_id,
        ),
        imdbId: normalizeText(
          row.IMDBID ?? row.imdb_id,
        ),
        rating: numericOrUndefined(row.Rating),
        watchedDate: normalizeText(
          row.WatchedDate ?? row.Date,
        ),
      }),
    )
    .filter(
      (record) =>
        Boolean(
          record.identity.tmdbId ||
            record.identity.imdbId ||
            record.identity.title,
        ),
    );

  return {
    provider: "letterboxd",
    format: "csv",
    records,
    warnings: [],
  };
}
