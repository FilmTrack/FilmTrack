"use client";

import type { TmdbMediaSummary } from "@/lib/tmdb";

type Props = {
  item: TmdbMediaSummary;
  selected: boolean;
  onToggle: () => void;
};

export default function SearchResultCard({
  item,
  selected,
  onToggle,
}: Props) {
  const title = item.title ?? item.name ?? "بدون عنوان";
  const type = item.media_type === "tv" ? "tv" : "movie";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-xl border p-4 text-right transition ${
        selected
          ? "border-blue-500 bg-blue-950/40"
          : "border-gray-800 bg-gray-900"
      }`}
    >
      <div className="text-white font-medium">{title}</div>
      <div className="mt-2 text-sm text-gray-400">
        {type === "tv" ? "سریال" : "فیلم"}
      </div>

      <div className="mt-3 text-sm">
        {selected ? "✓ انتخاب شده" : "انتخاب"}
      </div>
    </button>
  );
}
