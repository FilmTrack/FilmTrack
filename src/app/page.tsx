import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  Clapperboard,
  Flame,
  PlayCircle,
  Sparkles,
  Star,
  Tv,
} from "lucide-react";

import TmdbImage from "@/components/TmdbImage";
import { createClient } from "@/lib/supabase/server";

type TMDBResult = {
  id: number;
  poster_path: string | null;
  backdrop_path?: string | null;
  name?: string;
  title?: string;
  overview?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
};

const homeTitle = "FilmTrack | خانه فارسی طرفداران فیلم و سریال";
const homeDescription =
  "فیلم‌ها و سریال‌های تازه را کشف کن، امتیاز بده، تاریخ تماشا و Rewatch را ثبت کن و مسیر سینمایی خودت را در FilmTrack بساز.";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: homeTitle,
    description: homeDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
  },
};

async function fetchTMDB(endpoint: string): Promise<TMDBResult[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3${endpoint}?api_key=${apiKey}&language=fa-IR`,
      { next: { revalidate: 900 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

async function getIsLoggedIn(): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return false;
  }

  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    return Boolean(claimsData?.claims?.sub);
  } catch {
    return false;
  }
}

function titleOf(item: TMDBResult) {
  return item.title || item.name || "بدون عنوان";
}

function yearOf(item: TMDBResult) {
  const raw = item.release_date || item.first_air_date;
  return raw ? new Date(raw).getFullYear() : null;
}

function MediaRail({
  title,
  eyebrow,
  items,
  type,
}: {
  title: string;
  eyebrow: string;
  items: TMDBResult[];
  type: "tv" | "movie";
}) {
  if (!items.length) return null;

  return (
    <section className="mt-10 sm:mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-300">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">{title}</h2>
        </div>
        <Link
          href={type === "movie" ? "/movies" : "/shows"}
          className="hidden min-h-10 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-bold text-slate-400 transition hover:bg-white/[0.07] hover:text-white sm:inline-flex"
        >
          مشاهده بیشتر <ChevronLeft className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex snap-x gap-3 overflow-x-auto pb-3 sm:gap-4" style={{ scrollbarWidth: "none" }}>
        {items.slice(0, 16).map((item, index) => (
          <Link
            href={`/title/${item.id}?type=${type}`}
            key={item.id}
            className="group w-[138px] flex-none snap-start sm:w-[168px]"
          >
            <article className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-lg shadow-black/20 transition duration-300 group-hover:-translate-y-1 group-hover:border-blue-400/30">
              {item.poster_path ? (
                <TmdbImage
                  src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                  alt={`پوستر ${titleOf(item)}`}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-xs text-slate-500">بدون پوستر</div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-slate-300">
                  <span>{yearOf(item) || "—"}</span>
                  {typeof item.vote_average === "number" && item.vote_average > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-amber-300 backdrop-blur">
                      <Star className="h-3 w-3 fill-current" /> {item.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              <span className="absolute right-2 top-2 flex h-8 min-w-8 items-center justify-center rounded-xl border border-white/10 bg-black/55 px-2 text-xs font-black text-white backdrop-blur">
                {String(index + 1).padStart(2, "0")}
              </span>
            </article>
            <p className="mt-2 truncate text-sm font-bold text-slate-200 transition group-hover:text-white">{titleOf(item)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function Home() {
  const [trendingMovies, trendingShows, popularShows, topRatedShows] = await Promise.all([
    fetchTMDB("/trending/movie/week"),
    fetchTMDB("/trending/tv/week"),
    fetchTMDB("/tv/popular"),
    fetchTMDB("/tv/top_rated"),
  ]);

  const hero = trendingMovies.find((item) => item.backdrop_path) || trendingMovies[0] || trendingShows[0];
  const isLoggedIn = await getIsLoggedIn();

  const genres = [
    { id: 28, name: "اکشن" },
    { id: 35, name: "کمدی" },
    { id: 18, name: "درام" },
    { id: 27, name: "ترسناک" },
    { id: 878, name: "علمی‌تخیلی" },
    { id: 53, name: "هیجان‌انگیز" },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#050914] text-white" dir="rtl">
      <section className="relative isolate min-h-[620px] overflow-hidden border-b border-white/5 sm:min-h-[680px]">
        {hero?.backdrop_path && (
          <div className="absolute inset-0 -z-20">
            <TmdbImage
              src={`https://image.tmdb.org/t/p/original${hero.backdrop_path}`}
              alt=""
              className="h-full w-full object-cover object-center opacity-45"
            />
          </div>
        )}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#050914_5%,rgba(5,9,20,.93)_34%,rgba(5,9,20,.58)_64%,rgba(5,9,20,.45)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,#050914_0%,rgba(5,9,20,.82)_12%,transparent_52%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_26%,rgba(37,99,235,.19),transparent_30%),radial-gradient(circle_at_28%_12%,rgba(124,58,237,.14),transparent_28%)]" />

        <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-10 px-4 pb-16 pt-24 sm:min-h-[680px] sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-200 backdrop-blur">
              <Sparkles className="h-4 w-4" /> خانه فارسی طرفداران فیلم و سریال
            </div>

            <h1 className="mt-6 text-4xl font-black leading-[1.18] tracking-tight sm:text-5xl lg:text-7xl">
              هر فیلم، هر سریال،
              <span className="block bg-gradient-to-l from-violet-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">یک مسیر شخصی برای تو</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              کشف کن، امتیاز بده، در دفترچه تماشا ثبت کن و Rewatchهایت را نگه دار. FilmTrack قرار است خانه اصلی تجربه سینمایی فارسی‌زبان‌ها باشد.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={isLoggedIn ? "/dashboard" : "/auth"}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 px-6 text-sm font-black text-white shadow-xl shadow-blue-950/30 transition hover:-translate-y-0.5"
              >
                {isLoggedIn ? "رفتن به داشبورد" : "ساخت حساب FilmTrack"}
                <ArrowLeft className="h-4 w-4" />
              </Link>
              {hero && (
                <Link
                  href={`/title/${hero.id}?type=movie`}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/15 bg-black/25 px-5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10"
                >
                  <PlayCircle className="h-5 w-5" /> مشاهده عنوان منتخب
                </Link>
              )}
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur sm:p-4">
                <Flame className="h-4 w-4 text-orange-300" />
                <p className="mt-2 text-xs font-bold text-slate-300">ترندهای زنده</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur sm:p-4">
                <Star className="h-4 w-4 text-amber-300" />
                <p className="mt-2 text-xs font-bold text-slate-300">امتیاز شخصی</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur sm:p-4">
                <Clapperboard className="h-4 w-4 text-violet-300" />
                <p className="mt-2 text-xs font-bold text-slate-300">دفترچه تماشا</p>
              </div>
            </div>
          </div>

          {hero && (
            <Link
              href={`/title/${hero.id}?type=movie`}
              className="group hidden overflow-hidden rounded-3xl border border-white/10 bg-[#0b1220]/80 p-3 shadow-2xl shadow-black/40 backdrop-blur lg:block"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl">
                {hero.poster_path && (
                  <TmdbImage
                    src={`https://image.tmdb.org/t/p/w780${hero.poster_path}`}
                    alt={`پوستر ${titleOf(hero)}`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-5 pt-20">
                  <p className="text-xs font-bold text-blue-300">منتخب این هفته</p>
                  <p className="mt-1 text-xl font-black text-white">{titleOf(hero)}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
                    {yearOf(hero) && <span>{yearOf(hero)}</span>}
                    {typeof hero.vote_average === "number" && (
                      <span className="inline-flex items-center gap-1 text-amber-300">
                        <Star className="h-3.5 w-3.5 fill-current" /> {hero.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <MediaRail title="فیلم‌هایی که این هفته همه درباره‌شان حرف می‌زنند" eyebrow="ترند فیلم" items={trendingMovies} type="movie" />
        <MediaRail title="سریال‌های داغ این هفته" eyebrow="ترند سریال" items={trendingShows} type="tv" />

        <section className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(37,99,235,.12),rgba(124,58,237,.08),rgba(255,255,255,.02))] p-5 sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <Tv className="h-5 w-5 text-blue-300" /> کاوش بر اساس حال‌وهوای تماشا
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-400">به‌جای جست‌وجوی بی‌پایان، از ژانری شروع کن که همین حالا می‌خواهی ببینی.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <Link
                  href={`/genre/${genre.id}`}
                  key={genre.id}
                  className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-black/20 px-4 text-sm font-bold text-slate-300 transition hover:border-blue-400/30 hover:bg-blue-500/10 hover:text-white"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <MediaRail title="محبوب‌ترین سریال‌ها برای شروع" eyebrow="محبوب" items={popularShows} type="tv" />
        <MediaRail title="سریال‌های تحسین‌شده" eyebrow="بالاترین امتیاز" items={topRatedShows} type="tv" />
      </div>
    </main>
  );
}