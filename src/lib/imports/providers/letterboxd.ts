import type {
  CanonicalImportRecord,
  ImportAdapter,
} from "../types";

export type LetterboxdImportRow = {
  uri?: string;
  name?: string;
  year?: number;
  tmdbId?: number;
  imdbId?: string;
  rating?: number;
  watchedDate?: string;
};

export const letterboxdAdapter: ImportAdapter<LetterboxdImportRow> = {
  provider: "letterboxd",

  normalize(row): CanonicalImportRecord {
    return {
      provider: "letterboxd",
      externalId: row.uri,
      identity: {
        tmdbId: row.tmdbId,
        imdbId: row.imdbId,
        title: row.name,
        year: row.year,
        titleType: "movie",
      },
      status: row.watchedDate ? "completed" : "plan_to_watch",
      rating: row.rating,
      watchedAt: row.watchedDate,
    };
  },
};
