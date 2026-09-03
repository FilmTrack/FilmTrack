import type {
  CanonicalImportRecord,
  ImportAdapter,
} from "../types";

export type TraktImportRow = {
  traktId?: number;
  tmdbId?: number;
  imdbId?: string;
  title?: string;
  year?: number;
  mediaType: "movie" | "tv";
  watchedAt?: string;
  rating?: number;
};

export const traktAdapter: ImportAdapter<TraktImportRow> = {
  provider: "trakt",

  normalize(row): CanonicalImportRecord {
    return {
      provider: "trakt",
      externalId:
        row.traktId === undefined ? undefined : String(row.traktId),
      identity: {
        tmdbId: row.tmdbId,
        imdbId: row.imdbId,
        title: row.title,
        year: row.year,
        titleType: row.mediaType,
      },
      status: row.watchedAt ? "completed" : "plan_to_watch",
      rating: row.rating,
      watchedAt: row.watchedAt,
    };
  },
};
