import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Film, SlidersHorizontal, Sparkles, Star } from "lucide-react";

import TmdbImage from "@/components/TmdbImage";
import { Button } from "@/components/ui/button";
import { isRatingDiaryRuntimeEnabled } from "@/lib/m2/readiness";
import { rankContextualRecommendations, type ContextCandidate, type RecommendationContext } from "@/lib/m4/recommendation-v2";
import { buildTasteSeeds, identityKey, mergeRecommendationCandidates, rankRecommendationCandidates, type RecommendationCandidate, type TitleType } from "@/lib/m4/recommendations";
import { computeTasteDNA, type TasteMetadata, type TasteSignal } from "@/lib/m4/taste-dna";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "چی ببینم؟ | FilmTrack", robots: { index: false, follow: false } };

type UserListRow = { title_id: number; title_type: TitleType; status: string | null };
type RatingRow = { title_id: number; title_type: TitleType; rating_10: number };
type DiaryRow = { title_id: number; title_type: TitleType };
type TmdbItem = {
  id: number; title?: string; name?: string; poster_path?: string | null; release_date?: string; first_air_date?: string;
  popularity?: number; vote_average?: number; runtime?: number; episode_run_time?: number[]; original_language?: string;
  genres?: Array<{ name: string }>; production_countries?: Array<{ name: string }>; origin_country?: string[];
  credits?: { cast?: Array<{ name: string }>; crew?: Array<{ name: string; job?: string }> };
};

function displayTitle(item: TmdbItem | null, fallback: number) { return item?.title || item?.name || `عنوان #${fallback}`; }
async function fetchTmdb(path: string, apiKey: string): Promise<unknown | null> {
  try {
    const response = await fetch(`https://api.themoviedb.org/3${path}${path.includes("?") ? "&" : "?"}api_key=${apiKey}&language=fa-IR`, { next: { revalidate: 3600 } });
    return response.ok ? response.json() : null;
  } catch { return null; }
}
async function fetchDetail(type: TitleType, id: number, apiKey: string) {
  return fetchTmdb(`/${type}/${id}?append_to_response=credits`, apiKey) as Promise<TmdbItem | null>;
}
function people(detail: TmdbItem) {
  const director = detail.credits?.crew?.find((person) => person.job === "Director")?.name;
  return [director, ...(detail.credits?.cast || []).slice(0, 3).map((person) => person.name)].filter(Boolean) as string[];
}
function year(detail: TmdbItem) { const value = detail.release_date || detail.first_air_date; return value ? Number(value.slice(0, 4)) : null; }
function parseContext(params: Record<string, string | string[] | undefined>): RecommendationContext {
  const rawType = typeof params.type === "string" ? params.type : "any";
  const rawTime = typeof params.time === "string" ? params.time : "any";
  const rawDiscovery = typeof params.discovery === "string" ? params.discovery : "balanced";
  return {
    titleType: rawType === "movie" || rawType === "tv" ? rawType : "any",
    time: rawTime === "short" || rawTime === "standard" || rawTime === "long" ? rawTime : "any",
    discovery: rawDiscovery === "familiar" || rawDiscovery === "explore" ? rawDiscovery : "balanced",
  };
}

export default async function RecommendationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = parseContext(await searchParams);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth");

  const { data: listData } = await supabase.from("user_lists").select("title_id,title_type,status").eq("user_id", userId);
  let ratings: RatingRow[] = []; let diary: DiaryRow[] = [];
  if (isRatingDiaryRuntimeEnabled()) {
    const [{ data: r }, { data: d }] = await Promise.all([
      supabase.from("user_ratings").select("title_id,title_type,rating_10").eq("user_id", userId),
      supabase.from("diary_entries").select("title_id,title_type").eq("user_id", userId),
    ]);
    ratings = (r || []) as unknown as RatingRow[]; diary = (d || []) as unknown as DiaryRow[];
  }

  const tracking = ((listData || []) as unknown as UserListRow[]).map((item) => ({ titleId: item.title_id, titleType: item.title_type, status: item.status }));
  const seeds = buildTasteSeeds({ tracking, ratings: ratings.map((item) => ({ titleId: item.title_id, titleType: item.title_type, rating10: item.rating_10 })), diary: diary.map((item) => ({ titleId: item.title_id, titleType: item.title_type })) }).slice(0, 8);
  const apiKey = process.env.TMDB_API_KEY;
  const existingKeys = new Set([...tracking.map((item) => identityKey(item.titleId, item.titleType)), ...ratings.map((item) => identityKey(item.title_id, item.title_type)), ...diary.map((item) => identityKey(item.title_id, item.title_type))]);
  const seedDetails = new Map<string, TmdbItem>();
  const candidateBasics = new Map<string, TmdbItem>();
  const groups: RecommendationCandidate[][] = [];

  if (apiKey) {
    await Promise.all(seeds.map(async (seed) => {
      const [detail, payload] = await Promise.all([
        fetchDetail(seed.titleType, seed.titleId, apiKey),
        fetchTmdb(`/${seed.titleType}/${seed.titleId}/recommendations?page=1`, apiKey) as Promise<{ results?: TmdbItem[] } | null>,
      ]);
      if (detail) seedDetails.set(identityKey(seed.titleId, seed.titleType), detail);
      const items = (payload?.results || []).slice(0, 16);
      for (const item of items) candidateBasics.set(identityKey(item.id, seed.titleType), item);
      groups.push(rankRecommendationCandidates({ seed, excludedKeys: existingKeys, candidates: items.map((item) => ({ id: item.id, titleType: seed.titleType, popularity: item.popularity, voteAverage: item.vote_average })) }));
    }));
  }

  const metadata: TasteMetadata[] = [];
  const signals: TasteSignal[] = [];
  const diaryCounts = new Map<string, number>();
  for (const item of diary) diaryCounts.set(identityKey(item.title_id, item.title_type), (diaryCounts.get(identityKey(item.title_id, item.title_type)) || 0) + 1);
  const ratingMap = new Map(ratings.map((item) => [identityKey(item.title_id, item.title_type), item.rating_10]));
  for (const seed of seeds) {
    const detail = seedDetails.get(identityKey(seed.titleId, seed.titleType)); if (!detail) continue;
    metadata.push({ titleId: seed.titleId, titleType: seed.titleType, genres: (detail.genres || []).map((g) => g.name), people: people(detail), countries: (detail.production_countries || []).map((c) => c.name).length ? (detail.production_countries || []).map((c) => c.name) : (detail.origin_country || []), languages: detail.original_language ? [detail.original_language.toUpperCase()] : [], year: year(detail) });
    signals.push({ titleId: seed.titleId, titleType: seed.titleType, weight: Math.max(1, seed.score), watches: Math.max(1, diaryCounts.get(identityKey(seed.titleId, seed.titleType)) || 1), rating: ratingMap.get(identityKey(seed.titleId, seed.titleType)) });
  }
  const dna = computeTasteDNA({ metadata, signals });

  const initial = mergeRecommendationCandidates(groups, 48);
  const details = new Map<string, TmdbItem>();
  if (apiKey) {
    await Promise.all(initial.map(async (candidate) => {
      const detail = await fetchDetail(candidate.titleType, candidate.titleId, apiKey);
      if (detail) details.set(identityKey(candidate.titleId, candidate.titleType), detail);
    }));
  }
  const contextualCandidates: ContextCandidate[] = initial.flatMap((candidate) => {
    const detail = details.get(identityKey(candidate.titleId, candidate.titleType)); if (!detail) return [];
    return [{ titleId: candidate.titleId, titleType: candidate.titleType, genres: (detail.genres || []).map((g) => g.name), people: people(detail), countries: (detail.production_countries || []).map((c) => c.name).length ? (detail.production_countries || []).map((c) => c.name) : (detail.origin_country || []), languages: detail.original_language ? [detail.original_language.toUpperCase()] : [], year: year(detail), runtimeMinutes: detail.runtime, episodeRuntimeMinutes: detail.episode_run_time?.[0], popularity: detail.popularity, voteAverage: detail.vote_average }];
  });
  const recommendations = rankContextualRecommendations({ dna, candidates: contextualCandidates, context, excludedKeys: existingKeys, limit: 18 });

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_75%_0%,rgba(124,58,237,.15),transparent_30%),radial-gradient(circle_at_18%_5%,rgba(37,99,235,.12),transparent_28%)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"><ChevronRight className="h-4 w-4" /> بازگشت به داشبورد</Link>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-200"><Sparkles className="h-4 w-4" /> Recommendation v2</div>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">چی ببینم؟</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">Taste DNA تو + شرایط همین لحظه. هر نتیجه باید بتواند توضیح دهد چرا برای تو انتخاب شده است.</p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <form className="mb-8 grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:grid-cols-4" method="get">
          <div className="sm:col-span-4 flex items-center gap-2 font-black"><SlidersHorizontal className="h-4 w-4 text-violet-300" /> شرایط تماشای الان</div>
          <select name="type" defaultValue={context.titleType} className="min-h-11 rounded-xl border border-white/10 bg-[#0b1220] px-3 text-sm"><option value="any">فیلم یا سریال</option><option value="movie">فقط فیلم</option><option value="tv">فقط سریال</option></select>
          <select name="time" defaultValue={context.time} className="min-h-11 rounded-xl border border-white/10 bg-[#0b1220] px-3 text-sm"><option value="any">هر مدت</option><option value="short">وقت کم</option><option value="standard">زمان معمولی</option><option value="long">وقت آزاد زیاد</option></select>
          <select name="discovery" defaultValue={context.discovery} className="min-h-11 rounded-xl border border-white/10 bg-[#0b1220] px-3 text-sm"><option value="balanced">متعادل</option><option value="familiar">نزدیک به سلیقه‌ام</option><option value="explore">چیز تازه کشف کن</option></select>
          <Button type="submit" className="min-h-11 rounded-xl">پیشنهاد بده</Button>
        </form>

        {dna.sampleSize < 3 ? <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5 text-sm leading-7 text-amber-100">برای Recommendation v2 دقیق‌تر، چند عنوان دیگر ثبت یا امتیازدهی کن. فعلاً موتور از بهترین سیگنال‌های موجود استفاده می‌کند.</div> : null}

        {recommendations.length === 0 ? (
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center"><Film className="mx-auto h-8 w-8 text-blue-300" /><h2 className="mt-4 text-xl font-black">هنوز پیشنهاد کافی نداریم</h2><p className="mt-2 text-sm text-slate-500">چند عنوان را ثبت کن یا فیلترها را بازتر انتخاب کن.</p></section>
        ) : (
          <section>
            <div className="mb-5"><h2 className="text-2xl font-black">پیشنهادهای همین لحظه برای تو</h2><p className="mt-2 text-xs leading-6 text-slate-500">رتبه‌بندی از Taste DNA، کیفیت، زمان انتخابی و میزان آشنایی/اکتشاف ساخته شده است.</p></div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {recommendations.map((recommendation) => {
                const key = identityKey(recommendation.titleId, recommendation.titleType); const item = details.get(key) || candidateBasics.get(key) || null;
                return <Link key={key} href={`/title/${recommendation.titleId}?type=${recommendation.titleType}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/80 transition hover:border-violet-400/30">
                  <div className="aspect-[2/3] bg-white/[0.04]">{item?.poster_path ? <TmdbImage src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={`پوستر ${displayTitle(item, recommendation.titleId)}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : null}</div>
                  <div className="p-3"><h3 className="line-clamp-2 text-sm font-black">{displayTitle(item, recommendation.titleId)}</h3><p className="mt-2 line-clamp-3 text-[11px] leading-5 text-violet-200">{recommendation.reasons.slice(0, 2).join(" · ")}</p>{typeof item?.vote_average === "number" ? <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-500"><Star className="h-3 w-3" /> TMDB {item.vote_average.toFixed(1)}</p> : null}</div>
                </Link>;
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
