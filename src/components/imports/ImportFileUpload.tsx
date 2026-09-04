"use client";

import { useState } from "react";
import { FileUp, ShieldCheck } from "lucide-react";

import ImportPreviewSummary from "./ImportPreviewSummary";
import { buildImportPreview } from "@/lib/imports/preview";
import { parseImportFile } from "@/lib/imports/parsers";
import type {
  ImportPreviewSummary as PreviewSummary,
} from "@/lib/imports/preview";
import type { ImportProvider } from "@/lib/imports/types";

const providers: Array<{
  value: ImportProvider;
  label: string;
}> = [
  { value: "tv_time", label: "TV Time" },
  { value: "letterboxd", label: "Letterboxd" },
  { value: "trakt", label: "Trakt" },
];

export default function ImportFileUpload() {
  const [provider, setProvider] =
    useState<ImportProvider>("tv_time");

  const [summary, setSummary] =
    useState<PreviewSummary | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  async function handleFile(
    file: File | undefined,
  ) {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const content = await file.text();

      const parsed = parseImportFile({
        provider,
        filename: file.name,
        content,
      });

      const preview = await buildImportPreview(
        parsed.records,
      );

      setSummary(preview.summary);
    } catch {
      setError(
        "این فایل قابل پردازش نیست. فرمت خروجی و سرویس انتخاب‌شده را بررسی کنید.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-gray-800 bg-[#151515] p-4 sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-medium text-blue-300">
            Import امن
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            تاریخچه تماشای خودت را منتقل کن
          </h2>

          <p className="mt-2 text-sm leading-7 text-gray-400">
            ابتدا فایل فقط در مرورگر بررسی می‌شود و هیچ داده‌ای
            قبل از پیش‌نمایش و تأیید شما ذخیره نمی‌شود.
          </p>
        </div>

        <label className="block text-sm text-gray-300">
          سرویس مبدا
        </label>

        <select
          value={provider}
          onChange={(event) =>
            setProvider(
              event.target.value as ImportProvider,
            )
          }
          className="mt-2 w-full rounded-xl border border-gray-700 bg-[#101010] px-4 py-3 text-white outline-none focus:border-blue-500"
        >
          {providers.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>

        <label className="mt-4 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-[#101010] p-6 text-center transition hover:border-blue-500">
          <FileUp className="mb-3 h-7 w-7 text-blue-300" />

          <span className="font-medium text-white">
            انتخاب فایل خروجی
          </span>

          <span className="mt-1 text-xs leading-6 text-gray-500">
            CSV برای Letterboxd و Trakt؛ CSV یا JSON برای TV Time
          </span>

          <input
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="sr-only"
            disabled={loading}
            onChange={(event) =>
              void handleFile(
                event.target.files?.[0],
              )
            }
          />
        </label>

        <div className="mt-4 flex items-start gap-2 text-xs leading-6 text-gray-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          پردازش این مرحله فقط برای پیش‌نمایش است و مستقیماً
          چیزی در فهرست شما ذخیره نمی‌کند.
        </div>

        {loading && (
          <p className="mt-4 text-sm text-blue-300">
            در حال بررسی فایل...
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-900/50 bg-red-950/20 p-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}
      </div>

      {summary && (
        <ImportPreviewSummary summary={summary} />
      )}
    </section>
  );
}
