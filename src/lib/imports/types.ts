import type {
  TitleType,
  UserListStatus,
  UserListWriteInput,
} from "../user-lists/types";

export const IMPORT_PROVIDERS = [
  "tv_time",
  "letterboxd",
  "trakt",
] as const;

export type ImportProvider = (typeof IMPORT_PROVIDERS)[number];

export type ImportIdentityCandidate = {
  tmdbId?: number;
  imdbId?: string;
  title?: string;
  year?: number;
  titleType?: TitleType;
};

export type CanonicalImportRecord = {
  provider: ImportProvider;
  externalId?: string;
  identity: ImportIdentityCandidate;

  resolvedTitleId?: number;
  resolvedTitleType?: TitleType;

  status?: UserListStatus;
  rating?: number;
  watchedAt?: string;

  sourceMetadata?: Readonly<Record<string, string | number | boolean | null>>;
};

export type ImportAdapter<TSource> = {
  provider: ImportProvider;
  normalize(record: TSource): CanonicalImportRecord;
};

export type ResolvedImportRecord = CanonicalImportRecord & {
  resolvedTitleId: number;
  resolvedTitleType: TitleType;
  status: UserListStatus;
};

export function isResolvedImportRecord(
  record: CanonicalImportRecord,
): record is ResolvedImportRecord {
  return (
    Number.isInteger(record.resolvedTitleId) &&
    (record.resolvedTitleId ?? 0) > 0 &&
    (record.resolvedTitleType === "movie" ||
      record.resolvedTitleType === "tv") &&
    Boolean(record.status)
  );
}

export function toUserListWriteInput(
  record: ResolvedImportRecord,
): UserListWriteInput {
  return {
    titleId: record.resolvedTitleId,
    titleType: record.resolvedTitleType,
    status: record.status,
  };
}
