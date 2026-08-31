import Link from "next/link";
import { Sparkles, Star, Tv } from "lucide-react";

import TmdbImage from "@/components/TmdbImage";
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
  const shows = await fetchShows();

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_78%_10%,rgba(37,99,235,.15),transparent_30%),radial-gradient(circle_at_22%_0%,rgba(124,58,237,.11),transparent_25%)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-200">
            <Tv className="h-4 w-4" /> کاوش سریال‌ها
          </div>
          <h1 className="mt-5 text-3xl font-black sm:text-4xl lg:text-5xl">سریال‌هایی که ارزش دنبال‌کردن دارند</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            سریال‌های محبوب را کشف کن، فصل‌ها را ببین و تجربه تماشایت را در یک مسیر شخصی نگه دار.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {shows.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-violet-300" />
            <p className="mt-3 font-bold text-white">فهرست سریال‌ها فعلاً در دسترس نیست</p>
            <p className="mt-2 text-sm text-slate-500">کمی بعد دوباره تلاش کن یا از جست‌وجوی بالای صفحه استفاده کن.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {shows.map((show) => (
              <Link href={`/title/${show.id}?type=tv`} key={show.id} className="group min-w-0">
                <article className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-lg shadow-black/20 transition duration-300 group-hover:-translate-y-1 group-hover:border-violet-400/30">
                  {show.poster_path ? (
                    <TmdbImage
                      src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                      alt={`پوستر ${show.name || "سریال"}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-3 text-center text-xs text-slate-500">بدون پوستر</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/55 to-transparent" />
                  {typeof show.vote_average === "number" && show.vote_average > 0 && (
                    <span className="absolute left-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-black text-amber-300 backdrop-blur">
                      <Star className="h-3 w-3 fill-current" /> {show.vote_average.toFixed(1)}
                    </span>
                  )}
                </article>
                <p className="mt-2 truncate text-sm font-bold text-slate-200 group-hover:text-white">{show.name || "بدون عنوان"}</p>
                {show.first_air_date && (
                  <p className="mt-1 text-xs text-slate-500">{new Date(show.first_air_date).getFullYear()}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
