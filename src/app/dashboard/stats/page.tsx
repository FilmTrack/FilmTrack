import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, ChevronRight, Clapperboard, Globe2, Languages, RotateCcw, Sparkles, Star, Users } from "lucide-react";

import { isRatingDiaryRuntimeEnabled } from "@/lib/m2/readiness";
import { computeTasteDNA, type TasteMetadata, type TasteSignal, type TitleType } from "@/lib/m4/taste-dna";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "DNA سینمایی من | FilmTrack",
  robots: { index: false, follow: false },
};

type ListRow = { title_id: number; title_type: TitleType; status: string | null };
type RatingRow = { title_id: number; title_type: TitleType; rating_10: number };
type DiaryRow = { title_id: number; title_type: TitleType };
type TmdbDetail = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  original_language?: string;
  genres?: Array<{ name: string }>;
  production_countries?: Array<{ name: string }>;
  origin_country?: string[];
  credits?: { cast?: Array<{ name: string }>; crew?: Array<{ name: string; job?: string }> };
};

function idKey(id: number, type: TitleType) { return `${type}:${id}`; }

async function fetchDetail(type: TitleType, id: number, apiKey: string): Promise<TmdbDetail | null> {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=fa-IR&append_to_response=credits`, { next: { revalidate: 86400 } });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}

function MetricList({ title, icon, items }: { title: string; icon: React.ReactNode; items: Array<{ label: string; score: number; count: number }> }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0b1220]/80 p-5">
      <div className="flex items-center gap-2 text-sm font-black text-slate-200">{icon}{title}</div>
      <div className="mt-4 grid gap-3">
        {items.length ? items.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-4">
            <div className="min-w-0"><span className="ml-2 text-xs text-slate-600">#{index + 1}</span><span className="font-bold">{item.label}</span></div>
            <div className="flex items-center gap-2"><span className="text-xs text-slate-500">{item.count} عنوان</span><span className="rounded-full bg-violet-500/10 px-2 py-1 text-xs font-black text-violet-200">{item.score.toFixed(1)}</span></div>
          </div>
        )) : <p className="text-sm text-slate-500">داده کافی نیست.</p>}
      </div>
    </section>
  );
}

export default async function TasteStatsPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth");

  const { data: listData } = await supabase.from("user_lists").select("title_id,title_type,status").eq("user_id", userId);
  let ratings: RatingRow[] = [];
  let diary: DiaryRow[] = [];
  if (isRatingDiaryRuntimeEnabled()) {
    const [{ data: r }, { data: d }] = await Promise.all([
      supabase.from("user_ratings").select("title_id,title_type,rating_10").eq("user_id", userId),
      supabase.from("diary_entries").select("title_id,title_type").eq("user_id", userId),
    ]);
    ratings = (r || []) as unknown as RatingRow[];
    diary = (d || []) as unknown as DiaryRow[];
  }

  const lists = (listData || []) as unknown as ListRow[];
  const ratingMap = new Map(ratings.map((r) => [idKey(r.title_id, r.title_type), r.rating_10]));
  const watchCount = new Map<string, number>();
  for (const d of diary) watchCount.set(idKey(d.title_id, d.title_type), (watchCount.get(idKey(d.title_id, d.title_type)) || 0) + 1);

  const identities = new Map<string, { titleId: number; titleType: TitleType; status?: string | null }>();
  for (const row of lists) identities.set(idKey(row.title_id, row.title_type), { titleId: row.title_id, titleType: row.title_type, status: row.status });
  for (const row of ratings) identities.set(idKey(row.title_id, row.title_type), { titleId: row.title_id, titleType: row.title_type });
  for (const row of diary) identities.set(idKey(row.title_id, row.title_type), { titleId: row.title_id, titleType: row.title_type });

  const apiKey = process.env.TMDB_API_KEY;
  const metadataRows: TasteMetadata[] = [];
  const signals: TasteSignal[] = [];

  if (apiKey) {
    await Promise.all([...identities.values()].slice(0, 120).map(async (identity) => {
      const detail = await fetchDetail(identity.titleType, identity.titleId, apiKey);
      if (!detail) return;
      const director = detail.credits?.crew?.find((person) => person.job === "Director")?.name;
      const people = [director, ...(detail.credits?.cast || []).slice(0, 3).map((person) => person.name)].filter(Boolean) as string[];
      const yearValue = detail.release_date || detail.first_air_date;
      metadataRows.push({
        titleId: identity.titleId,
        titleType: identity.titleType,
        genres: (detail.genres || []).map((g) => g.name),
        people,
        countries: (detail.production_countries || []).map((c) => c.name).length ? (detail.production_countries || []).map((c) => c.name) : (detail.origin_country || []),
        languages: detail.original_language ? [detail.original_language.toUpperCase()] : [],
        year: yearValue ? Number(yearValue.slice(0, 4)) : null,
      });
      const rating = ratingMap.get(idKey(identity.titleId, identity.titleType));
      const watches = Math.max(1, watchCount.get(idKey(identity.titleId, identity.titleType)) || 0);
      let weight = identity.status === "completed" ? 3 : identity.status === "watching" ? 1.5 : 1;
      if (rating) weight += rating >= 9 ? 4 : rating >= 8 ? 3 : rating >= 7 ? 2 : rating >= 5 ? 1 : 0.5;
      weight += Math.min(4, Math.max(0, watches - 1) * 1.5);
      signals.push({ titleId: identity.titleId, titleType: identity.titleType, weight, watches, rating });
    }));
  }

  const dna = computeTasteDNA({ metadata: metadataRows, signals });
  const enough = dna.sampleSize >= 3;

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_75%_0%,rgba(124,58,237,.18),transparent_32%),radial-gradient(circle_at_15%_0%,rgba(37,99,235,.12),transparent_30%)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"><ChevronRight className="h-4 w-4" /> بازگشت به داشبورد</Link>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-black text-violet-200"><Sparkles className="h-4 w-4" /> Taste DNA v1</div>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">DNA سینمایی من</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">هویت سینمایی تو از تاریخچه واقعی FilmTrack ساخته می‌شود؛ قابل‌توضیح، خصوصی و بدون مدل پولی.</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {!enough ? <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5 text-sm leading-7 text-amber-100">برای DNA دقیق‌تر حداقل چند عنوان را ثبت، امتیازدهی یا تماشا کن. همین صفحه با رشد تاریخچه‌ات دقیق‌تر می‌شود.</div> : null}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><Star className="h-4 w-4 text-amber-300"/><p className="mt-3 text-2xl font-black">{dna.averageRating ?? "—"}</p><p className="mt-1 text-xs text-slate-500">میانگین امتیاز · {dna.ratingStrictness}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><RotateCcw className="h-4 w-4 text-violet-300"/><p className="mt-3 text-2xl font-black">{dna.rewatchRate}%</p><p className="mt-1 text-xs text-slate-500">نرخ بازتماشا</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><Clapperboard className="h-4 w-4 text-blue-300"/><p className="mt-3 text-2xl font-black">{dna.movieShare}%</p><p className="mt-1 text-xs text-slate-500">سهم فیلم</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><BarChart3 className="h-4 w-4 text-emerald-300"/><p className="mt-3 text-2xl font-black">{dna.tvShare}%</p><p className="mt-1 text-xs text-slate-500">سهم سریال</p></div>
          <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:col-span-1"><Sparkles className="h-4 w-4 text-violet-300"/><p className="mt-3 text-2xl font-black">{dna.sampleSize}</p><p className="mt-1 text-xs text-slate-500">عنوان تحلیل‌شده</p></div>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <MetricList title="ژانرهای غالب" icon={<Clapperboard className="h-4 w-4 text-blue-300"/>} items={dna.genres} />
          <MetricList title="چهره‌های محبوب" icon={<Users className="h-4 w-4 text-violet-300"/>} items={dna.people} />
          <MetricList title="کشورها" icon={<Globe2 className="h-4 w-4 text-emerald-300"/>} items={dna.countries} />
          <MetricList title="زبان‌ها" icon={<Languages className="h-4 w-4 text-amber-300"/>} items={dna.languages} />
          <MetricList title="دهه‌های محبوب" icon={<BarChart3 className="h-4 w-4 text-cyan-300"/>} items={dna.decades} />
        </div>

        <section className="mt-6 rounded-3xl border border-violet-400/15 bg-violet-500/[0.07] p-5 sm:p-6">
          <h2 className="font-black">این DNA فقط نمایش آماری نیست</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">همین مدل ورودی Recommendation v2 و Taste Match #87 خواهد بود؛ یعنی FilmTrack می‌تواند توضیح دهد چرا دو کاربر سلیقه مشابه دارند یا چرا یک عنوان به تو پیشنهاد شده است.</p>
          <Link href="/dashboard/recommendations" className="mt-4 inline-flex text-sm font-black text-violet-200 hover:text-white">رفتن به «چی ببینم؟»</Link>
        </section>
      </div>
    </main>
  );
}
