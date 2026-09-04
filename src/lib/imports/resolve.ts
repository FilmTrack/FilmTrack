import type { TitleType } from "../user-lists/types";
import type { CanonicalImportRecord } from "./types";

export type ImportMatchReason =
  | "tmdb_id"
  | "imdb_id"
  | "title_year";

export type ImportResolutionCandidate = {
  titleId: number;
  titleType: TitleType;
  reason: ImportMatchReason;
};

export type ImportResolutionStatus =
  | "resolved"
  | "unresolved"
  | "ambiguous";

export type ImportResolutionResult = {
  status: ImportResolutionStatus;
  record: CanonicalImportRecord;
  candidates: ImportResolutionCandidate[];
};

export type ImportIdentityResolver = (
  record: CanonicalImportRecord,
) =>
  | Promise<ImportResolutionCandidate[]>
  | ImportResolutionCandidate[];

function validCandidate(
  candidate: ImportResolutionCandidate,
) {
  return (
    Number.isInteger(candidate.titleId) &&
    candidate.titleId > 0 &&
    (candidate.titleType === "movie" ||
      candidate.titleType === "tv")
  );
}

function directTmdbCandidate(
  record: CanonicalImportRecord,
): ImportResolutionCandidate | null {
  const { tmdbId, titleType } = record.identity;

  if (
    Number.isInteger(tmdbId) &&
    (tmdbId ?? 0) > 0 &&
    (titleType === "movie" || titleType === "tv")
  ) {
    return {
      titleId: tmdbId as number,
      titleType,
      reason: "tmdb_id",
    };
  }

  return null;
}

export async function resolveImportIdentity(
  record: CanonicalImportRecord,
  resolver?: ImportIdentityResolver,
): Promise<ImportResolutionResult> {
  if (
    record.resolvedTitleId &&
    record.resolvedTitleType
  ) {
    return {
      status: "resolved",
      record,
      candidates: [
        {
          titleId: record.resolvedTitleId,
          titleType: record.resolvedTitleType,
          reason: "tmdb_id",
        },
      ],
    };
  }

  const direct = directTmdbCandidate(record);

  if (direct) {
    return {
      status: "resolved",
      record: {
        ...record,
        resolvedTitleId: direct.titleId,
        resolvedTitleType: direct.titleType,
      },
      candidates: [direct],
    };
  }

  if (!resolver) {
    return {
      status: "unresolved",
      record,
      candidates: [],
    };
  }

  const candidates = (await resolver(record))
    .filter(validCandidate);

  if (candidates.length === 0) {
    return {
      status: "unresolved",
      record,
      candidates: [],
    };
  }

  if (candidates.length > 1) {
    return {
      status: "ambiguous",
      record,
      candidates,
    };
  }

  const [candidate] = candidates;

  return {
    status: "resolved",
    record: {
      ...record,
      resolvedTitleId: candidate.titleId,
      resolvedTitleType: candidate.titleType,
    },
    candidates,
  };
}

export async function resolveImportBatch(
  records: CanonicalImportRecord[],
  resolver?: ImportIdentityResolver,
) {
  return Promise.all(
    records.map((record) =>
      resolveImportIdentity(record, resolver),
    ),
  );
}
