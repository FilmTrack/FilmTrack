import { tvTimeAdapter } from "../providers/tv-time";
import { csvObjects } from "./csv";
import {
  normalizeText,
  numericOrUndefined,
  type ImportParseResult,
} from "./types";

type TvTimeSource = Record<string, unknown>;

function normalizeRows(
  rows: TvTimeSource[],
): ImportParseResult {
  const records = rows
    .map((row) =>
      tvTimeAdapter.normalize({
        id: normalizeText(row.id),
        tmdbId: numericOrUndefined(
          row.tmdbId ?? row.tmdb_id,
        ),
        imdbId: normalizeText(
          row.imdbId ?? row.imdb_id,
        ),
        title: normalizeText(
          row.title ?? row.name,
        ),
        year: numericOrUndefined(row.year),
        mediaType:
          row.mediaType === "tv" ||
          row.type === "tv" ||
          row.type === "show"
            ? "tv"
            : "movie",
        watched:
          row.watched === true ||
          row.status === "watched",
        watchedAt: normalizeText(
          row.watchedAt ?? row.watched_at,
        ),
        rating: numericOrUndefined(row.rating),
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
    provider: "tv_time",
    format: "json",
    records,
    warnings: [],
  };
}

export function parseTvTimeJson(
  content: string,
): ImportParseResult {
  const parsed = JSON.parse(content) as unknown;

  const rows = Array.isArray(parsed)
    ? parsed
    : typeof parsed === "object" &&
        parsed !== null &&
        Array.isArray(
          (parsed as { items?: unknown[] }).items,
        )
      ? (parsed as { items: TvTimeSource[] }).items
      : null;

  if (!rows) {
    throw new Error("unsupported_tv_time_json");
  }

  return normalizeRows(rows as TvTimeSource[]);
}

export function parseTvTimeCsv(
  content: string,
): ImportParseResult {
  const rows = csvObjects(content);

  const result = normalizeRows(rows);

  return {
    ...result,
    format: "csv",
  };
}
