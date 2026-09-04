import type {
  ImportProvider,
} from "../types";

import { parseLetterboxdCsv } from "./letterboxd";
import { parseTraktCsv } from "./trakt";
import {
  parseTvTimeCsv,
  parseTvTimeJson,
} from "./tv-time";

export function parseImportFile({
  provider,
  filename,
  content,
}: {
  provider: ImportProvider;
  filename: string;
  content: string;
}) {
  const extension =
    filename.split(".").pop()?.toLowerCase();

  if (provider === "letterboxd") {
    if (extension !== "csv") {
      throw new Error("letterboxd_requires_csv");
    }

    return parseLetterboxdCsv(content);
  }

  if (provider === "trakt") {
    if (extension !== "csv") {
      throw new Error("trakt_requires_csv");
    }

    return parseTraktCsv(content);
  }

  if (extension === "json") {
    return parseTvTimeJson(content);
  }

  if (extension === "csv") {
    return parseTvTimeCsv(content);
  }

  throw new Error("unsupported_import_file");
}
