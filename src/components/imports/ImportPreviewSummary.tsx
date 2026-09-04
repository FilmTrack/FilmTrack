import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  DatabaseZap,
} from "lucide-react";

import type {
  ImportPreviewSummary,
} from "@/lib/imports/preview";

type Props = {
  summary: ImportPreviewSummary;
};

const providerLabels = {
  tv_time: "TV Time",
  letterboxd: "Letterboxd",
  trakt: "Trakt",
  mixed: "چند منبع",
} as const;

export default function ImportPreviewSummary({
  summary,
}: Props) {
  return (
    <section
      className="rounded-2xl border border-gray-800 bg-[#151515] p-4 sm:p-6"
      aria-labelledby="import-preview-heading"
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-blue-300">
            پیش‌نمایش بدون ذخیره
          </p>

          <h2
            id="import-preview-heading"
            className="mt-1 text-lg font-semibold text-white"
          >
            نتیجه بررسی {providerLabels[summary.provider]}
          </h2>
        </div>

        <div className="text-sm text-gray-400">
          {summary.total.toLocaleString("fa-IR")} رکورد
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <PreviewMetric
          label="قابل ورود"
          value={summary.resolved}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <PreviewMetric
          label="نیازمند بررسی"
          value={summary.ambiguous}
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        <PreviewMetric
          label="پیدا نشد"
          value={summary.unresolved}
          icon={<CircleHelp className="h-5 w-5" />}
        />

        <PreviewMetric
          label="قابل نوشتن"
          value={summary.writable}
          icon={<DatabaseZap className="h-5 w-5" />}
        />
      </div>

      <p className="mt-5 text-sm leading-7 text-gray-400">
        فقط مواردی که هویت آن‌ها با اطمینان مشخص شده باشد
        اجازه ورود به فهرست FilmTrack را دارند. موارد مبهم یا
        پیدا نشده بدون تأیید ذخیره نمی‌شوند.
      </p>
    </section>
  );
}

function PreviewMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-800 bg-[#101010] p-3 sm:p-4">
      <div className="mb-3 text-gray-400">
        {icon}
      </div>

      <div className="text-xl font-bold text-white sm:text-2xl">
        {value.toLocaleString("fa-IR")}
      </div>

      <div className="mt-1 text-xs text-gray-400 sm:text-sm">
        {label}
      </div>
    </div>
  );
}
