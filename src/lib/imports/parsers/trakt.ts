import { traktAdapter } from "../providers/trakt";
import { csvObjects } from "./csv";
import {
  normalizeText,
  numericOrUndefined,
  type ImportParseResult,
} from "./types";

export function parseTraktCsv(
  content: string,
): ImportParseResult {
  const rows = csvObjects(content);

  const records = rows
    .map((row) => {
      const rawType = (
        row.Type ??
        row.type ??
        row.MediaType ??
        ""
      )
        .trim()
        .toLowerCase();

      const mediaType =
        rawType === "show" || rawType === "tv"
          ? "tv"
          : "movie";

      return traktAdapter.normalize({
        traktId: numericOrUndefined(
          row.TraktID ?? row.trakt_id,
        ),
        tmdbId: numericOrUndefined(
          row.TMDBID ?? row.tmdb_id,
        ),
        imdbId: normalizeText(
          row.IMDBID ?? row.imdb_id,
        ),
        title: normalizeText(
          row.Title ?? row.Name,
        ),
        year: numericOrUndefined(row.Year),
        mediaType,
        watchedAt: normalizeText(
          row.WatchedAt ?? row.watched_at,
        ),
        rating: numericOrUndefined(row.Rating),
      });
    })
    .filter(
      (record) =>
        Boolean(
          record.identity.tmdbId ||
            record.identity.imdbId ||
            record.identity.title,
        ),
    );

  return {
    provider: "trakt",
    format: "csv",
    records,
    warnings: [],
  };
}
