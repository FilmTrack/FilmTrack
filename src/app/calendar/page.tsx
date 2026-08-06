import Link from "next/link";

import TmdbImage from "@/components/TmdbImage";
import {
  fetchJson,
  type TmdbMediaSummary,
  type TmdbSearchResponse,
} from "@/lib/tmdb";

type CalendarRelease = TmdbMediaSummary & {
  type: "movie" | "tv";
  date: string;
};

export default async function CalendarPage() {
  const apiKey = process.env.TMDB_API_KEY;
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];
  const todayStr = formatDate(today);
  const nextWeekStr = formatDate(nextWeek);

  const movieUrl = new URL("https://api.themoviedb.org/3/discover/movie");
  const showUrl = new URL("https://api.themoviedb.org/3/discover/tv");

  for (const url of [movieUrl, showUrl]) {
    url.searchParams.set("api_key", apiKey ?? "");
    url.searchParams.set("sort_by", "popularity.desc");
  }

  movieUrl.searchParams.set("primary_release_date.gte", todayStr);
  movieUrl.searchParams.set("primary_release_date.lte", nextWeekStr);
  showUrl.searchParams.set("air_date.gte", todayStr);
  showUrl.searchParams.set("air_date.lte", nextWeekStr);

  const [moviesData, showsData] = apiKey
    ? await Promise.all([
        fetchJson<TmdbSearchResponse>(movieUrl),
        fetchJson<TmdbSearchResponse>(showUrl),
      ])
    : [null, null];

  const movieReleases: CalendarRelease[] = (moviesData?.results ?? [])
    .filter((movie) => Boolean(movie.release_date))
    .map((movie) => ({
      ...movie,
      type: "movie",
      date: movie.release_date ?? "",
    }));

  const showReleases: CalendarRelease[] = (showsData?.results ?? [])
    .filter((show) => Boolean(show.first_air_date))
    .map((show) => ({
      ...show,
      type: "tv",
      date: show.first_air_date ?? "",
    }));

  const combinedReleases = [...movieReleases, ...showReleases].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const formatPersianDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fa-IR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 border-r-4 border-blue-600 pr-3">
          تقویم هفته آینده 📅
        </h1>

        {combinedReleases.length === 0 ? (
          <p className="text-gray-400 text-lg">
            هیچ فیلم یا سریالی برای هفته آینده یافت نشد.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {combinedReleases.map((item) => (
              <Link
                href={`/title/${item.id}?type=${item.type}`}
                key={`${item.id}-${item.type}`}
                className="group"
              >
                <div className="w-full aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden group-hover:scale-105 transition-transform">
                  {item.poster_path && (
                    <TmdbImage
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                      alt={item.title || item.name || "Poster"}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <p className="mt-2 text-sm font-medium truncate">
                  {item.title || item.name}
                </p>
                <p className="text-xs text-blue-500">
                  {formatPersianDate(item.date)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
