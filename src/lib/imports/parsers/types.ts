import type {
  CanonicalImportRecord,
  ImportProvider,
} from "../types";

export type ImportFileFormat = "csv" | "json";

export type ImportParseResult = {
  provider: ImportProvider;
  format: ImportFileFormat;
  records: CanonicalImportRecord[];
  warnings: string[];
};

export type ImportFileParser = (
  content: string,
) => ImportParseResult;

export function numericOrUndefined(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0
    ? number
    : undefined;
}

export function normalizeText(value: unknown) {
  if (typeof value !== "string") return undefined;

  const normalized = value.trim();

  return normalized || undefined;
}
