import Link from "next/link";
import { Sparkles, Star, Tv } from "lucide-react";

import TmdbImage from "@/components/TmdbImage";
import { demoShows, isLocalVisualQa } from "@/lib/demo-catalog";
import {
  fetchJson,
  type TmdbMediaSummary,
  type TmdbSearchResponse,
} from "@/lib/tmdb";

async function fetchShows(): Promise<TmdbMediaSummary[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [];

  const url = new URL("https://api.themoviedb.org/3/tv/popular");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "fa-IR");
  url.searchParams.set("page", "1");

  const data = await fetchJson<TmdbSearchResponse>(url);
  return data?.results ?? [];
}

export default async function ShowsPage() {
  const liveShows = await fetchShows();
  const shows = liveShows.length ? liveShows : isLocalVisualQa ? demoShows : [];
  const isDemo = liveShows.length === 0 && isLocalVisualQa;

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_78%_10%,rgba(37,99,235,.15),transparent_30%),radial-gradient(circle_at_22%_0%,rgba(124,58,237,.11),transparent_25%)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-200">
            <Tv className="h-4 w-4" /> کاوش سریال‌ها
          </div>
          <h1 className="mt-5 text-3xl font-black sm:text-4xl lg:text-5xl">سریال‌هایی که ارزش دنبال‌کردن دارند</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            از سریال‌های محبوب تا عنوان‌های تحسین‌شده؛ مسیر تماشایت را پیدا کن و همه‌چیز را در FilmTrack نگه دار.
          </p>
          {isDemo && (
            <p className="mt-4 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-200">
              حالت نمایشی محلی برای بررسی کامل رابط کاربری
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {shows.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-blue-300" />
            <p className="mt-3 font-bold text-white">فهرست سریال‌ها فعلاً در دسترس نیست</p>
            <p className="mt-2 text-sm text-slate-500">کمی بعد دوباره تلاش کن یا از جست‌وجوی بالای صفحه استفاده کن.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {shows.map((show, index) => {
              const href = isDemo ? `/qa/title/${show.id}?type=tv` : `/title/${show.id}?type=tv`;
              return (
                <Link href={href} key={show.id} className="group min-w-0">
                  <article className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-lg shadow-black/20 transition duration-300 group-hover:-translate-y-1 group-hover:border-violet-400/30">
                    {show.poster_path ? (
                      <TmdbImage
                        src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                        alt={`پوستر ${show.name || "سریال"}`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full flex-col justify-between bg-[radial-gradient(circle_at_30%_18%,rgba(124,58,237,.34),transparent_30%),linear-gradient(145deg,#101b31,#080d19_65%,#132e3b)] p-4">
                        <span className="text-xs font-black text-violet-200">FILMTRACK SERIES</span>
                        <div>
                          <span className="text-4xl font-black text-white/10">{String(index + 1).padStart(2, "0")}</span>
                          <p className="mt-2 text-lg font-black leading-7 text-white">{show.name || "سریال"}</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/55 to-transparent" />
                    {typeof show.vote_average === "number" && show.vote_average > 0 && (
                      <span className="absolute left-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-black text-amber-300 backdrop-blur">
                        <Star className="h-3 w-3 fill-current" /> {show.vote_average.toFixed(1)}
                      </span>
                    )}
                  </article>
                  <p className="mt-2 truncate text-sm font-bold text-slate-200 group-hover:text-white">{show.name || "بدون عنوان"}</p>
                  {show.first_air_date && <p className="mt-1 text-xs text-slate-500">{new Date(show.first_air_date).getFullYear()}</p>}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
