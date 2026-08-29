import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import TmdbImage from "@/components/TmdbImage";
import { ChevronLeft, Star, Users, PlayCircle, Clapperboard } from "lucide-react";
import ActionButtons from "@/components/ActionButtons";
import CommentsSection from "@/components/CommentsSection";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
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

export async function generateMetadata({
  params,
  searchParams,
}: TitlePageProps): Promise<Metadata> {
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

  const urls = [
    `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=en-US&append_to_response=credits,videos`,
    `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=fa-IR`,
  ];

  const [enRes, faRes] = await Promise.all(
    urls.map((url) => fetchJson<TmdbTitleDetails>(url)),
  );
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
        const imdbRating = ratings.find(
          (rating) => rating.Source === "Internet Movie Database",
        );
        const rtRating = ratings.find(
          (rating) => rating.Source === "Rotten Tomatoes",
        );

        if (imdbRating) imdbScore = imdbRating.Value.split("/")[0];
        if (rtRating) rtScore = rtRating.Value;
      }
    } catch {
      // Keep the TMDB-derived fallback scores.
    }
  }

  const trailer = data.videos?.results?.find(
    (video) => video.type === "Trailer" && video.site === "YouTube",
  );
  const director =
    data.credits?.crew?.find((crewMember) => crewMember.job === "Director") ||
    data.created_by?.[0];
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
    <div className="min-h-screen bg-[#0e0e0e] text-white relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <div className="absolute top-0 left-0 w-full h-[70vh] overflow-hidden">
        {data.backdrop_path && (
          <TmdbImage
            src={`https://image.tmdb.org/t/p/original${data.backdrop_path}`}
            alt={title}
            className="w-full h-full object-cover opacity-20"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8 pt-24 md:pt-32">
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8"
        >
          <ChevronLeft className="w-5 h-5" /> بازگشت
        </Link>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
            <div className="w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-gray-800">
              {data.poster_path && (
                <TmdbImage
                  src={`https://image.tmdb.org/t/p/w500${data.poster_path}`}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <ActionButtons titleId={id} type={type} />
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold">{faTitle}</h1>
              <h2 className="text-lg text-gray-500 mt-1">{title}</h2>
              <p className="text-sm text-gray-500 mt-2">
                {releaseYear}
                {runtime > 0 ? ` • ${runtime} دقیقه` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-gray-300 text-sm border-b border-gray-800 pb-4 mt-2">
              <span className="flex items-center gap-1 font-bold text-yellow-500">
                <Star className="w-4 h-4 fill-yellow-500" /> {data.vote_average?.toFixed(1)}/10
                <span className="text-gray-500 text-xs mr-1">
                  ({data.vote_count?.toLocaleString()} رأی TMDB)
                </span>
              </span>

              {data.imdb_id && (
                <a
                  href={`https://www.imdb.com/title/${data.imdb_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-gray-700"
                >
                  <svg width="40" height="20" viewBox="0 0 64 32" xmlns="http://www.w3.org/2000/svg">
                    <rect width="64" height="32" rx="6" fill="#F5C518" />
                    <text
                      x="32"
                      y="22"
                      fontFamily="Arial, sans-serif"
                      fontSize="14"
                      fontWeight="bold"
                      fill="#000"
                      textAnchor="middle"
                    >
                      IMDb
                    </text>
                  </svg>
                  <span className="font-bold text-white text-base">{imdbScore}/10</span>
                </a>
              )}

              <a
                href={rtUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-gray-700"
              >
                <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M50 12c-6 0-9 4-9 9 0 4 2 6 3 7-3 1-7 2-10 4-3 2-5 5-5 9h42c0-4-2-7-5-9-3-2-7-3-10-4 1-1 3-3 3-7 0-5-3-9-9-9z"
                    fill="#009A44"
                  />
                  <path
                    d="M14 42c-2 0-4 1-4 4v8c0 18 12 34 40 34s40-16 40-34v-8c0-3-2-4-4-4H14z"
                    fill="#E61E2A"
                  />
                </svg>
                <span className="font-bold text-white text-base">{rtScore}</span>
              </a>
            </div>

            <div className="flex flex-wrap gap-2">
              {data.genres?.map((genre) => (
                <Badge
                  key={genre.id}
                  variant="secondary"
                  className="bg-gray-800 text-gray-300"
                >
                  {genre.name}
                </Badge>
              ))}
            </div>

            {trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 mt-2 font-medium"
              >
                <PlayCircle className="w-5 h-5" /> تماشای تریلر رسمی
              </a>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <h3 className="text-lg font-bold mb-1">خلاصه داستان (فارسی)</h3>
                <p className="text-gray-400 leading-relaxed">
                  {faOverview || "خلاصه‌ای برای این عنوان یافت نشد."}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1 text-gray-500">Synopsis (English)</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  {data.overview || "No overview available."}
                </p>
              </div>
            </div>

            {cast.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" /> بازیگران و عوامل
                </h3>
                {director && (
                  <p className="text-gray-400 text-sm mb-3">
                    ساخته شده توسط: <span className="text-white font-medium">{director.name}</span>
                  </p>
                )}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {cast.map((member) => (
                    <div key={member.id} className="flex-shrink-0 w-20 text-center">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-800 mb-2 border-2 border-gray-700">
                        {member.profile_path && (
                          <TmdbImage
                            src={`https://image.tmdb.org/t/p/w200${member.profile_path}`}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <p className="text-xs text-white font-medium truncate">{member.name}</p>
                      <p className="text-xs text-gray-500 truncate">{member.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {type === "tv" && data.seasons && data.seasons.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Clapperboard className="w-5 h-5 text-blue-500" /> قسمت‌ها و فصل‌ها
                </h3>
                <div className="space-y-3">
                  {data.seasons
                    .filter((season) => season.season_number > 0)
                    .map((season) => (
                      <details
                        key={season.id}
                        className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden group"
                      >
                        <summary className="flex items-center gap-4 p-3 cursor-pointer hover:bg-gray-800 transition-colors list-none">
                          {season.poster_path ? (
                            <TmdbImage
                              src={`https://image.tmdb.org/t/p/w200${season.poster_path}`}
                              alt={season.name}
                              className="w-12 h-16 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center flex-shrink-0 text-xs">
                              بدون عکس
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-bold text-white">{season.name}</h4>
                            <p className="text-xs text-gray-500">
                              {season.episode_count} قسمت
                              {season.air_date
                                ? ` | پخش: ${new Date(season.air_date).getFullYear()}`
                                : ""}
                            </p>
                          </div>
                          <ChevronLeft className="w-5 h-5 text-gray-500 group-open:-rotate-90 transition-transform" />
                        </summary>
                        <div className="p-4 pt-0 text-sm text-gray-400">
                          <p className="mb-4">
                            {season.overview || `شامل ${season.episode_count} قسمت از این فصل.`}
                          </p>
                        </div>
                      </details>
                    ))}
                </div>
              </div>
            )}

            <CommentsSection
              titleId={id}
              titleType={type}
              initialComments={comments || []}
              isLoggedIn={isLoggedIn}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
