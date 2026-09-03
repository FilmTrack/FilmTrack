import type { CanonicalImportRecord } from "./types";

function canonicalKey(record: CanonicalImportRecord) {
  if (record.resolvedTitleId && record.resolvedTitleType) {
    return `resolved:${record.resolvedTitleType}:${record.resolvedTitleId}`;
  }

  if (record.identity.tmdbId && record.identity.titleType) {
    return `tmdb:${record.identity.titleType}:${record.identity.tmdbId}`;
  }

  if (record.identity.imdbId) {
    return `imdb:${record.identity.imdbId.trim().toLowerCase()}`;
  }

  const title = record.identity.title?.trim().toLowerCase() ?? "";
  const year = record.identity.year ?? "";
  const type = record.identity.titleType ?? "";

  return `candidate:${type}:${title}:${year}`;
}

export function normalizeImportRecords(
  records: CanonicalImportRecord[],
): CanonicalImportRecord[] {
  const normalized = new Map<string, CanonicalImportRecord>();

  for (const record of records) {
    normalized.set(canonicalKey(record), record);
  }

  return [...normalized.values()];
}
