import type {
  CanonicalImportRecord,
  ImportAdapter,
} from "../types";

export type TvTimeImportRow = {
  id?: string;
  tmdbId?: number;
  imdbId?: string;
  title?: string;
  year?: number;
  mediaType?: "movie" | "tv";
  watched?: boolean;
  watchedAt?: string;
  rating?: number;
};

export const tvTimeAdapter: ImportAdapter<TvTimeImportRow> = {
  provider: "tv_time",

  normalize(row): CanonicalImportRecord {
    return {
      provider: "tv_time",
      externalId: row.id,
      identity: {
        tmdbId: row.tmdbId,
        imdbId: row.imdbId,
        title: row.title,
        year: row.year,
        titleType: row.mediaType,
      },
      status: row.watched ? "completed" : "plan_to_watch",
      rating: row.rating,
      watchedAt: row.watchedAt,
    };
  },
};
