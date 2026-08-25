"use client";

import type { TmdbMediaSummary } from "@/lib/tmdb";
import SearchResultCard from "./SearchResultCard";
import { useSelection } from "@/lib/user-lists/use-selection";

export default function SearchResultsGrid({
  results,
}: {
  results: TmdbMediaSummary[];
}) {
  const selection = useSelection();

  return (
    <div>
      <div className="mb-4 text-gray-300">
        انتخاب شده: {selection.count}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {results.map((item) => (
          <SearchResultCard
            key={`${item.media_type}-${item.id}`}
            item={item}
            selected={selection.isSelected({
              id: item.id,
              titleType: item.media_type === "tv" ? "tv" : "movie",
            })}
            onToggle={() =>
              selection.toggle({
                id: item.id,
                titleType: item.media_type === "tv" ? "tv" : "movie",
              })
            }
          />
        ))}
      </div>
    </div>
  );
}
