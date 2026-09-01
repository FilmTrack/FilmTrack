import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  Clapperboard,
  Clock3,
  ExternalLink,
  PlayCircle,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import ActionButtons from "@/components/ActionButtons";
import CommentsSection from "@/components/CommentsSection";
import RatingDiaryPanel from "@/components/RatingDiaryPanel";
import TmdbImage from "@/components/TmdbImage";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getRottenTomatoesUrl } from "@/lib/title-links.mjs";
import {
  fetchJson,
  type OmdbResponse,
  type TmdbMediaType,
  type TmdbTitleDetails,
  type TranslationResponse,
} from "@/lib/tmdb";
import {
  buildTitleMetadata,
  buildTitleStructuredData,
} from "@/lib/seo/public-entity";

type TitlePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
};

async function fetchTitleDetailsForSeo(id: string, type: TmdbMediaType) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || !id) return null;

  const [enRes, faRes] = await Promise.all([
    fetchJson<TmdbTitleDetails>(
      `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=en-US`,
    ),
    fetchJson<TmdbTitleDetails>(
      `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=fa-IR`,
    ),
  ]);

  if (!enRes) return null;

  return {
    data: enRes,
    localizedTitle: faRes?.title || faRes?.name || enRes.title || enRes.name,
    localizedOverview: faRes?.overview || enRes.overview,
  };
}

export async function generateMetadata({ params, searchParams }: TitlePageProps): Promise<Metadata> {
  const { id } = await params;
  const { type: rawType } = await searchParams;
  const type: TmdbMediaType = rawType === "tv" ? "tv" : "movie";
  const seoData = await fetchTitleDetailsForSeo(id, type);

  if (!seoData) {
    return {
      title: "عنوان یافت نشد | FilmTrack",
      robots: { index: false, follow: true },
    };
  }

  return buildTitleMetadata({
    id,
    type,
    data: seoData.data,
    localizedTitle: seoData.localizedTitle,
    localizedOverview: seoData.localizedOverview,
  });
}

export default async function TitlePage({ params, searchParams }: TitlePageProps) {
  const { id } = await params;
  const { type: rawType } = await searchParams;
  const type: TmdbMediaType = rawType === "tv" ? "tv" : "movie";
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey || !id) return notFound();

  const [enRes, faRes] = await Promise.all([
    fetchJson<TmdbTitleDetails>(
      `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=en-US&append_to_response=credits,videos`,
    ),
    fetchJson<TmdbTitleDetails>(
      `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=fa-IR`,
    ),
  ]);

  if (!enRes) return notFound();

  const data = enRes;
  const faData: Partial<TmdbTitleDetails> = faRes ?? {};
  const title = data.title || data.name || "Untitled";
  const faTitle = faData.title || faData.name || title;
  const releaseYear = data.release_date
    ? new Date(data.release_date).getFullYear()
    : data.first_air_date
      ? new Date(data.first_air_date).getFullYear()
      : "N/A";
  const runtime = data.runtime || (data.episode_run_time && data.episode_run_time[0]) || 0;

  let faOverview = faData.overview;
  if (!faOverview && data.overview) {
    try {
      const transUrl = new URL("https://api.mymemory.translated.net/get");
      transUrl.searchParams.set("q", data.overview);
      transUrl.searchParams.set("langpair", "en|fa");
      const transData = await fetchJson<TranslationResponse>(transUrl);
      faOverview = transData?.responseData?.translatedText || data.overview;
    } catch {
      faOverview = data.overview;
    }
  }

  let imdbScore = data.vote_average?.toFixed(1) || "N/A";
  let rtScore = `${Math.round((data.vote_average || 0) * 10)}%`;

  if (process.env.OMDB_API_KEY && data.imdb_id) {
    try {
      const omdbRes = await fetch(
        `https://www.omdbapi.com/?i=${data.imdb_id}&apikey=${process.env.OMDB_API_KEY}`,
        { next: { revalidate: 604800 } },
      );
      const omdbData = (await omdbRes.json()) as OmdbResponse;

      if (omdbData.Response === "True") {
        const ratings = omdbData.Ratings || [];
        const imdbRating = ratings.find((rating) => rating.Source === "Internet Movie Database");
        const rtRating = ratings.find((rating) => rating.Source === "Rotten Tomatoes");
        if (imdbRating) imdbScore = imdbRating.Value.split("/")[0];
        if (rtRating) rtScore = rtRating.Value;
      }
    } catch {
      // Keep TMDB-derived fallbacks.
    }
  }

  const trailer = data.videos?.results?.find(
    (video) => video.type === "Trailer" && video.site === "YouTube",
  );
  const director =
    data.credits?.crew?.find((crewMember) => crewMember.job === "Director") || data.created_by?.[0];
  const cast = data.credits?.cast?.slice(0, 12) || [];

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(claimsData?.claims?.sub);
  const { data: comments } = await supabase
    .from("comments")
    .select("id, content, is_spoiler, created_at")
    .eq("title_id", Number(id))
    .eq("title_type", type)
    .order("created_at", { ascending: false });

  const rtUrl = getRottenTomatoesUrl(title, type);
  const structuredData = buildTitleStructuredData({
    id,
    type,
    data,
    localizedTitle: faTitle,
    localizedOverview: faOverview,
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050914] text-white" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-[72vh] overflow-hidden">
        {data.backdrop_path && (
          <TmdbImage
            src={`https://image.tmdb.org/t/p/original${data.backdrop_path}`}
            alt=""
            className="h-full w-full object-cover opacity-25 blur-[1px]"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,9,20,.18)_0%,rgba(5,9,20,.72)_52%,#050914_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(59,130,246,.14),transparent_32%),radial-gradient(circle_at_32%_12%,rgba(139,92,246,.12),transparent_30%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 md:pt-28 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 text-sm font-bold text-slate-300 backdrop-blur transition hover:border-blue-400/30 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
          بازگشت به FilmTrack
        </Link>

        <section className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)_300px] lg:gap-8">
          <div className="mx-auto w-full max-w-[330px] lg:mx-0">
            <div className="group relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl shadow-black/40">
              {data.poster_path ? (
                <TmdbImage
                  src={`https://image.tmdb.org/t/p/w780${data.poster_path}`}
                  alt={`پوستر ${faTitle}`}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">بدون پوستر</div>
              )}
              {trailer && (
                <a
                  href={`https://www.youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`تماشای تریلر ${faTitle}`}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-black/55 shadow-2xl backdrop-blur transition hover:scale-105 hover:bg-black/70">
                    <PlayCircle className="h-8 w-8 text-white" />
                  </span>
                </a>
              )}
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/90 p-2 shadow-xl backdrop-blur">
              <ActionButtons titleId={id} type={type} />
            </div>
          </div>

          <div className="min-w-0">
            <div className="rounded-2xl border border-white/10 bg-[#07101d]/72 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-blue-300">
                  {type === "tv" ? "سریال" : "فیلم"}
                </span>
                <span>{releaseYear}</span>
                {runtime > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" /> {runtime} دقیقه
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                {faTitle}
              </h1>
              <p className="mt-2 text-base font-medium text-slate-500 sm:text-lg" dir="ltr">
                {title}
              </p>

              <nav aria-label="ژانرهای این عنوان" className="mt-5 flex flex-wrap gap-2">
                {data.genres?.map((genre) => (
                  <Link key={genre.id} href={`/genre/${genre.id}`} className="rounded-full">
                    <Badge className="border border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-300 hover:bg-white/[0.08] hover:text-white">
                      {genre.name}
                    </Badge>
                  </Link>
                ))}
              </nav>

              <p className="mt-6 max-w-3xl text-sm leading-8 text-slate-300 sm:text-base">
                {faOverview || "خلاصه‌ای برای این عنوان یافت نشد."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {trailer && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 px-5 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5"
                  >
                    <PlayCircle className="h-5 w-5" /> تماشای تریلر
                  </a>
                )}
                {data.imdb_id && (
                  <a
                    href={`https://www.imdb.com/title/${data.imdb_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-bold text-slate-200 hover:bg-white/[0.08]"
                  >
                    IMDb <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>

              {director && (
                <div className="mt-6 border-t border-white/10 pt-5 text-sm text-slate-400">
                  کارگردان / سازنده: <span className="font-bold text-white">{director.name}</span>
                </div>
              )}
            </div>

            <div className="mt-6">
              <RatingDiaryPanel titleId={Number(id)} titleType={type} />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#0b1220]/90 p-5 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <Sparkles className="h-4 w-4 text-violet-300" /> امتیازهای مرجع
              </div>
              <div className="mt-5 grid gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs text-slate-500">TMDB</p>
                  <p className="mt-1 flex items-center gap-2 text-2xl font-black text-white">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    {data.vote_average?.toFixed(1) || "N/A"}
                    <span className="text-sm font-medium text-slate-500">/10</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{data.vote_count?.toLocaleString()} رأی</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs text-slate-500">IMDb</p>
                    <p className="mt-1 font-black text-amber-300">{imdbScore}/10</p>
                  </div>
                  <a
                    href={rtUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.07]"
                  >
                    <p className="text-xs text-slate-500">Rotten Tomatoes</p>
                    <p className="mt-1 font-black text-emerald-300">{rtScore}</p>
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0b1220]/90 p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <CalendarDays className="h-4 w-4 text-blue-300" /> خلاصه عنوان
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
                  <dt className="text-slate-500">سال انتشار</dt>
                  <dd className="font-bold text-white">{releaseYear}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
                  <dt className="text-slate-500">نوع</dt>
                  <dd className="font-bold text-white">{type === "tv" ? "سریال" : "فیلم"}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">زبان اصلی</dt>
                  <dd className="font-bold text-white">{data.original_language?.toUpperCase() || "—"}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </section>

        {cast.length > 0 && (
          <section className="mt-8 rounded-2xl border border-white/10 bg-[#08111e]/80 p-5 shadow-xl backdrop-blur sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-2 text-lg font-black text-white">
                <Users className="h-5 w-5 text-blue-300" /> بازیگران و عوامل
              </h2>
              <span className="text-xs text-slate-500">{cast.length} نفر منتخب</span>
            </div>
            <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
              {cast.map((member) => (
                <div key={member.id} className="w-24 flex-none text-center">
                  <div className="mx-auto h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                    {member.profile_path && (
                      <TmdbImage
                        src={`https://image.tmdb.org/t/p/w200${member.profile_path}`}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <p className="mt-2 truncate text-xs font-bold text-white">{member.name}</p>
                  <p className="mt-1 truncate text-[11px] text-slate-500">{member.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {type === "tv" && data.seasons && data.seasons.length > 0 && (
          <section className="mt-8 rounded-2xl border border-white/10 bg-[#08111e]/80 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-black text-white">
              <Clapperboard className="h-5 w-5 text-violet-300" /> فصل‌ها
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {data.seasons
                .filter((season) => season.season_number > 0)
                .map((season) => (
                  <details key={season.id} className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                    <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 p-3 transition hover:bg-white/[0.04]">
                      {season.poster_path ? (
                        <TmdbImage
                          src={`https://image.tmdb.org/t/p/w200${season.poster_path}`}
                          alt={season.name}
                          className="h-14 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-14 w-10 rounded-lg bg-white/5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-white">{season.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{season.episode_count} قسمت</p>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-slate-500 transition group-open:-rotate-90" />
                    </summary>
                    <p className="border-t border-white/10 p-4 text-sm leading-7 text-slate-400">
                      {season.overview || `شامل ${season.episode_count} قسمت از این فصل.`}
                    </p>
                  </details>
                ))}
            </div>
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#08111e]/80 p-5 sm:p-6">
          <h2 className="text-lg font-black text-white">درباره عنوان</h2>
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold text-blue-300">خلاصه فارسی</p>
              <p className="mt-2 text-sm leading-8 text-slate-300">{faOverview || "خلاصه‌ای موجود نیست."}</p>
            </div>
            <div dir="ltr" className="text-left">
              <p className="text-xs font-bold text-slate-500">English synopsis</p>
              <p className="mt-2 text-sm leading-7 text-slate-500">{data.overview || "No overview available."}</p>
            </div>
          </div>
        </section>

        <div className="mt-8">
          <CommentsSection
            titleId={id}
            titleType={type}
            initialComments={comments || []}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>
    </main>
  );
}
