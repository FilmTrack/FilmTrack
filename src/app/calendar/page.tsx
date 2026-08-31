import Link from "next/link";
import { CalendarDays, Film, Sparkles, Tv } from "lucide-react";

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
    url.searchParams.set("language", "fa-IR");
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
    .map((movie) => ({ ...movie, type: "movie", date: movie.release_date ?? "" }));

  const showReleases: CalendarRelease[] = (showsData?.results ?? [])
    .filter((show) => Boolean(show.first_air_date))
    .map((show) => ({ ...show, type: "tv", date: show.first_air_date ?? "" }));

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
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_75%_5%,rgba(37,99,235,.15),transparent_32%),radial-gradient(circle_at_25%_0%,rgba(124,58,237,.12),transparent_28%)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-200">
            <CalendarDays className="h-4 w-4" /> برنامه تماشای هفته
          </div>
          <h1 className="mt-5 text-3xl font-black sm:text-4xl lg:text-5xl">تقویم انتشار هفت روز آینده</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            فیلم‌ها و سریال‌هایی را که در روزهای پیش رو منتشر می‌شوند یک‌جا ببین و برای تماشایشان آماده باش.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {combinedReleases.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-blue-300" />
            <p className="mt-3 font-bold text-white">برای این بازه عنوانی پیدا نشد</p>
            <p className="mt-2 text-sm text-slate-500">تقویم با داده‌های تازه به‌روزرسانی می‌شود؛ کمی بعد دوباره بررسی کن.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {combinedReleases.map((item) => (
              <Link
                href={`/title/${item.id}?type=${item.type}`}
                key={`${item.id}-${item.type}`}
                className="group min-w-0"
              >
                <article className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-lg shadow-black/20 transition duration-300 group-hover:-translate-y-1 group-hover:border-blue-400/30">
                  {item.poster_path ? (
                    <TmdbImage
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                      alt={`پوستر ${item.title || item.name || "عنوان"}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-500">بدون پوستر</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2 py-1 text-[11px] font-bold text-white backdrop-blur">
                    {item.type === "movie" ? <Film className="h-3 w-3" /> : <Tv className="h-3 w-3" />}
                    {item.type === "movie" ? "فیلم" : "سریال"}
                  </span>
                </article>
                <p className="mt-2 truncate text-sm font-bold text-slate-200 group-hover:text-white">{item.title || item.name}</p>
                <p className="mt-1 text-xs font-bold text-blue-300">{formatPersianDate(item.date)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
