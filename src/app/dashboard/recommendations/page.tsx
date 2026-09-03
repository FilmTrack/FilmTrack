import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Film, Sparkles, Star } from "lucide-react";

import TmdbImage from "@/components/TmdbImage";
import { Button } from "@/components/ui/button";
import { isRatingDiaryRuntimeEnabled } from "@/lib/m2/readiness";
import {
  buildTasteSeeds,
  identityKey,
  mergeRecommendationCandidates,
  rankRecommendationCandidates,
  type RecommendationCandidate,
  type TitleType,
} from "@/lib/m4/recommendations";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "پیشنهادهای شخصی | FilmTrack",
  robots: { index: false, follow: false },
};

type UserListRow = { title_id: number; title_type: TitleType; status: string | null };
type RatingRow = { title_id: number; title_type: TitleType; rating_10: number };
type DiaryRow = { title_id: number; title_type: TitleType };
type TmdbItem = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  popularity?: number;
  vote_average?: number;
};

function displayTitle(item: TmdbItem | null, fallback: number) {
  return item?.title || item?.name || `عنوان #${fallback}`;
}

async function fetchTmdb(path: string, apiKey: string) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3${path}${path.includes("?") ? "&" : "?"}api_key=${apiKey}&language=fa-IR`,
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export default async function RecommendationsPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth");

  const { data: listData } = await supabase
    .from("user_lists")
    .select("title_id,title_type,status")
    .eq("user_id", userId);

  let ratings: RatingRow[] = [];
  let diary: DiaryRow[] = [];

  if (isRatingDiaryRuntimeEnabled()) {
    const [{ data: ratingData }, { data: diaryData }] = await Promise.all([
      supabase.from("user_ratings").select("title_id,title_type,rating_10").eq("user_id", userId),
      supabase.from("diary_entries").select("title_id,title_type").eq("user_id", userId),
    ]);
    ratings = (ratingData || []) as unknown as RatingRow[];
    diary = (diaryData || []) as unknown as DiaryRow[];
  }

  const tracking = ((listData || []) as unknown as UserListRow[]).map((item) => ({
    titleId: item.title_id,
    titleType: item.title_type,
    status: item.status,
  }));

  const seeds = buildTasteSeeds({
    tracking,
    ratings: ratings.map((item) => ({ titleId: item.title_id, titleType: item.title_type, rating10: item.rating_10 })),
    diary: diary.map((item) => ({ titleId: item.title_id, titleType: item.title_type })),
  }).slice(0, 5);

  const apiKey = process.env.TMDB_API_KEY;
  const existingKeys = new Set([
    ...tracking.map((item) => identityKey(item.titleId, item.titleType)),
    ...ratings.map((item) => identityKey(item.title_id, item.title_type)),
    ...diary.map((item) => identityKey(item.title_id, item.title_type)),
  ]);

  const seedDetails = new Map<string, TmdbItem | null>();
  const candidateDetails = new Map<string, TmdbItem>();
  const rankedGroups: RecommendationCandidate[][] = [];

  if (apiKey && seeds.length > 0) {
    await Promise.all(
      seeds.map(async (seed) => {
        const detail = (await fetchTmdb(`/${seed.titleType}/${seed.titleId}`, apiKey)) as TmdbItem | null;
        seedDetails.set(identityKey(seed.titleId, seed.titleType), detail);

        const payload = (await fetchTmdb(`/${seed.titleType}/${seed.titleId}/recommendations?page=1`, apiKey)) as { results?: TmdbItem[] } | null;
        const items = (payload?.results || []).slice(0, 12);
        for (const item of items) {
          candidateDetails.set(identityKey(item.id, seed.titleType), item);
        }
        rankedGroups.push(
          rankRecommendationCandidates({
            seed,
            excludedKeys: existingKeys,
            candidates: items.map((item) => ({
              id: item.id,
              titleType: seed.titleType,
              popularity: item.popularity,
              voteAverage: item.vote_average,
            })),
          }),
        );
      }),
    );
  }

  const recommendations = mergeRecommendationCandidates(rankedGroups, 18);

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_75%_0%,rgba(124,58,237,.15),transparent_30%),radial-gradient(circle_at_18%_5%,rgba(37,99,235,.12),transparent_28%)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-400 hover:text-white">
            <ChevronRight className="h-4 w-4" /> بازگشت به داشبورد
          </Link>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-200">
            <Sparkles className="h-4 w-4" /> Taste Profile v1
          </div>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">چی ببینم؟</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            پیشنهادها از رفتار واقعی خودت در FilmTrack ساخته می‌شوند؛ نه از یک رتبه‌بندی عمومی. هر پیشنهاد دلیل قابل‌فهم خودش را دارد.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {seeds.length === 0 ? (
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <Film className="mx-auto h-8 w-8 text-blue-300" />
            <h2 className="mt-4 text-xl font-black">هنوز سلیقه‌ات را به‌اندازه کافی نمی‌شناسیم</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-500">
              چند عنوان را تماشا شده یا در حال تماشا ثبت کن. وقتی Rating/Diary فعال باشد، امتیازهای بالا و Rewatchها هم وزن بیشتری به Taste Profile می‌دهند.
            </p>
            <Link href="/movies" className="mt-5 inline-flex"><Button className="rounded-xl">شروع ثبت سلیقه</Button></Link>
          </section>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="text-xl font-black">سیگنال‌های اصلی سلیقه تو</h2>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {seeds.map((seed) => {
                  const detail = seedDetails.get(identityKey(seed.titleId, seed.titleType)) || null;
                  return (
                    <Link key={identityKey(seed.titleId, seed.titleType)} href={`/title/${seed.titleId}?type=${seed.titleType}`} className="min-w-52 rounded-2xl border border-white/10 bg-[#0b1220]/80 p-4">
                      <p className="font-black">{displayTitle(detail, seed.titleId)}</p>
                      <p className="mt-2 text-xs leading-6 text-slate-500">{seed.signals.slice(0, 2).join(" · ")}</p>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-5">
                <h2 className="text-xl font-black sm:text-2xl">پیشنهادهای شخصی تو</h2>
                <p className="mt-2 text-xs leading-6 text-slate-500">امتیاز TMDB فقط اطلاعات مرجع عنوان است؛ رتبه این فهرست از Taste Profile خصوصی تو ساخته می‌شود.</p>
              </div>

              {recommendations.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-center text-sm text-slate-400">
                  فعلاً پیشنهاد کافی پیدا نشد. با ثبت عنوان‌های بیشتر، این صفحه دقیق‌تر می‌شود.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {recommendations.map((recommendation) => {
                    const key = identityKey(recommendation.titleId, recommendation.titleType);
                    const item = candidateDetails.get(key) || null;
                    const reasonSeed = recommendation.basedOn[0];
                    const reasonTitle = reasonSeed ? displayTitle(seedDetails.get(identityKey(reasonSeed.titleId, reasonSeed.titleType)) || null, reasonSeed.titleId) : "سلیقه‌ات";
                    return (
                      <Link key={key} href={`/title/${recommendation.titleId}?type=${recommendation.titleType}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/80 transition hover:border-violet-400/30">
                        <div className="aspect-[2/3] bg-white/[0.04]">
                          {item?.poster_path ? <TmdbImage src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={`پوستر ${displayTitle(item, recommendation.titleId)}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : null}
                        </div>
                        <div className="p-3">
                          <h3 className="line-clamp-2 text-sm font-black">{displayTitle(item, recommendation.titleId)}</h3>
                          <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-violet-200">چون «{reasonTitle}» را دوست داشتی</p>
                          {typeof item?.vote_average === "number" ? <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-500"><Star className="h-3 w-3" /> TMDB {item.vote_average.toFixed(1)}</p> : null}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
