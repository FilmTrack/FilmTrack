import Link from "next/link";
import { Compass, Film, ListVideo, Sparkles, Star } from "lucide-react";

import TmdbImage from "@/components/TmdbImage";
import { demoMovies, isLocalVisualQa } from "@/lib/demo-catalog";
import {
  fetchJson,
  type TmdbMediaSummary,
  type TmdbSearchResponse,
} from "@/lib/tmdb";

async function fetchMovies(): Promise<TmdbMediaSummary[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [];

  const url = new URL("https://api.themoviedb.org/3/movie/popular");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "fa-IR");
  url.searchParams.set("page", "1");

  const data = await fetchJson<TmdbSearchResponse>(url);
  return data?.results ?? [];
}

export default async function MoviesPage() {
  const liveMovies = await fetchMovies();
  const movies = liveMovies.length ? liveMovies : isLocalVisualQa ? demoMovies : [];
  const isDemo = liveMovies.length === 0 && isLocalVisualQa;
  const hasLiveCatalog = Boolean(process.env.TMDB_API_KEY);

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_78%_10%,rgba(37,99,235,.15),transparent_30%),radial-gradient(circle_at_22%_0%,rgba(124,58,237,.11),transparent_25%)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-200">
            <Film className="h-4 w-4" /> کاوش فیلم‌ها
          </div>
          <h1 className="mt-5 text-3xl font-black sm:text-4xl lg:text-5xl">فیلم‌های محبوب این روزها</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            عنوان‌های پرطرفدار را سریع پیدا کن، وارد صفحه هر فیلم شو و امتیاز، فهرست و دفترچه تماشایت را مدیریت کن.
          </p>
          {isDemo && (
            <p className="mt-4 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-200">
              حالت نمایشی محلی برای بررسی کامل رابط کاربری
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {movies.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(37,99,235,.08),rgba(124,58,237,.05),rgba(255,255,255,.02))] p-7 text-center sm:p-10">
            <Sparkles className="mx-auto h-7 w-7 text-blue-300" />
            <p className="mt-4 text-lg font-black text-white">
              {hasLiveCatalog ? "فعلاً فیلمی برای نمایش پیدا نشد" : "کاتالوگ زنده فیلم‌ها در Preview غیرفعال است"}
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">
              {hasLiveCatalog
                ? "می‌توانی از کشف فارسی یا ژانرها مسیر دیگری برای پیدا کردن عنوان مناسب شروع کنی."
                : "برای حفظ امنیت، کلید TMDB تولید به محیط Preview داده نشده است. رابط کاربری و مسیرهای FilmTrack همچنان قابل بررسی هستند."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/discover" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 px-4 text-sm font-black text-white transition hover:opacity-95">
                <Compass className="h-4 w-4" /> کشف فارسی
              </Link>
              <Link href="/genres" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-slate-200 transition hover:bg-white/[0.08]">
                <ListVideo className="h-4 w-4" /> مرور ژانرها
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {movies.map((movie, index) => {
              const href = isDemo ? `/qa/title/${movie.id}?type=movie` : `/title/${movie.id}?type=movie`;
              return (
                <Link href={href} key={movie.id} className="group min-w-0">
                  <article className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-lg shadow-black/20 transition duration-300 group-hover:-translate-y-1 group-hover:border-blue-400/30">
                    {movie.poster_path ? (
                      <TmdbImage
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={`پوستر ${movie.title || "فیلم"}`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full flex-col justify-between bg-[radial-gradient(circle_at_70%_18%,rgba(59,130,246,.35),transparent_30%),linear-gradient(145deg,#111c35,#080d19_65%,#201044)] p-4">
                        <span className="text-xs font-black text-blue-200">FILMTRACK</span>
                        <div>
                          <span className="text-4xl font-black text-white/10">{String(index + 1).padStart(2, "0")}</span>
                          <p className="mt-2 text-lg font-black leading-7 text-white">{movie.title || "فیلم"}</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/55 to-transparent" />
                    {typeof movie.vote_average === "number" && movie.vote_average > 0 && (
                      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-black text-amber-300 backdrop-blur">
                        <Star className="h-3 w-3 fill-current" /> {movie.vote_average.toFixed(1)}
                      </span>
                    )}
                  </article>
                  <p className="mt-2 truncate text-sm font-bold text-slate-200 group-hover:text-white">{movie.title || "بدون عنوان"}</p>
                  {movie.release_date && <p className="mt-1 text-xs text-slate-500">{new Date(movie.release_date).getFullYear()}</p>}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
