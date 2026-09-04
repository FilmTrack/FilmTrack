import {
  resolveImportBatch,
  type ImportIdentityResolver,
  type ImportResolutionResult,
} from "./resolve";
import {
  normalizeImportRecords,
} from "./normalize";
import type {
  CanonicalImportRecord,
  ImportProvider,
} from "./types";

export type ImportPreviewSummary = {
  provider: ImportProvider | "mixed";
  total: number;
  resolved: number;
  ambiguous: number;
  unresolved: number;
  writable: number;
};

export type ImportPreviewPlan = {
  summary: ImportPreviewSummary;
  results: ImportResolutionResult[];
};

function detectProvider(
  records: CanonicalImportRecord[],
): ImportProvider | "mixed" {
  const providers = new Set(
    records.map((record) => record.provider),
  );

  if (providers.size === 1) {
    return records[0]?.provider ?? "mixed";
  }

  return "mixed";
}

export async function buildImportPreview(
  records: CanonicalImportRecord[],
  resolver?: ImportIdentityResolver,
): Promise<ImportPreviewPlan> {
  const normalized = normalizeImportRecords(records);

  const results = await resolveImportBatch(
    normalized,
    resolver,
  );

  const resolved = results.filter(
    (result) => result.status === "resolved",
  ).length;

  const ambiguous = results.filter(
    (result) => result.status === "ambiguous",
  ).length;

  const unresolved = results.filter(
    (result) => result.status === "unresolved",
  ).length;

  return {
    summary: {
      provider: detectProvider(normalized),
      total: normalized.length,
      resolved,
      ambiguous,
      unresolved,
      writable: resolved,
    },
    results,
  };
}
