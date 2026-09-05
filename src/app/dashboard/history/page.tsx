import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ChevronRight, Film, RotateCcw, Sparkles, Star } from "lucide-react";

import TmdbImage from "@/components/TmdbImage";
import { Button } from "@/components/ui/button";
import { isRatingDiaryRuntimeEnabled } from "@/lib/m2/readiness";
import { createClient } from "@/lib/supabase/server";

type TitleType = "movie" | "tv";

type RatingRow = {
  id: number;
  title_id: number;
  title_type: TitleType;
  rating_10: number;
  updated_at: string;
};

type DiaryRow = {
  id: number;
  title_id: number;
  title_type: TitleType;
  watched_on: string;
  created_at: string;
};

type TmdbTitle = {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
};

function titleKey(titleId: number, titleType: TitleType) {
  return `${titleType}:${titleId}`;
}

function titleName(item: TmdbTitle | null, fallbackId: number) {
  return item?.title || item?.name || `عنوان شماره ${fallbackId.toLocaleString("fa-IR")}`;
}

function formatPersianDate(value: string) {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(`${value}T12:00:00Z`));
  } catch {
    return value;
  }
}

export default async function PersonalHistoryPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect("/auth");

  const enabled = isRatingDiaryRuntimeEnabled();

  if (!enabled) {
    return (
      <main className="min-h-screen bg-[#050914] px-4 py-10 text-white sm:px-6" dir="rtl">
        <div className="mx-auto max-w-4xl">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-400 hover:text-white">
            <ChevronRight className="h-4 w-4" /> بازگشت به داشبورد
          </Link>
          <section className="mt-6 rounded-3xl border border-blue-400/15 bg-[linear-gradient(135deg,rgba(37,99,235,.10),rgba(124,58,237,.08))] p-6 sm:p-8">
            <Sparkles className="h-7 w-7 text-blue-300" />
            <h1 className="mt-4 text-2xl font-black sm:text-3xl">تاریخچه شخصی فیلم‌ترک</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              زیرساخت امتیاز، دفترچه تماشا و بازتماشا آماده است، اما فعال‌سازی نهایی این قابلیت هنوز انجام نشده است.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const [{ data: ratingData, error: ratingError }, { data: diaryData, error: diaryError }] = await Promise.all([
    supabase
      .from("user_ratings")
      .select("id,title_id,title_type,rating_10,updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("diary_entries")
      .select("id,title_id,title_type,watched_on,created_at")
      .eq("user_id", userId)
      .order("watched_on", { ascending: false })
      .order("id", { ascending: false }),
  ]);

  const ratings = (ratingData || []) as unknown as RatingRow[];
  const diary = (diaryData || []) as unknown as DiaryRow[];
  const readFailed = Boolean(ratingError || diaryError);

  const uniqueIdentities = new Map<string, { titleId: number; titleType: TitleType }>();
  for (const row of [...ratings, ...diary]) {
    uniqueIdentities.set(titleKey(row.title_id, row.title_type), {
      titleId: row.title_id,
      titleType: row.title_type,
    });
  }

  const apiKey = process.env.TMDB_API_KEY;
  const titleDetails = new Map<string, TmdbTitle | null>();

  if (apiKey && uniqueIdentities.size > 0) {
    await Promise.all(
      [...uniqueIdentities.values()].map(async ({ titleId, titleType }) => {
        const key = titleKey(titleId, titleType);
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/${titleType}/${titleId}?api_key=${apiKey}&language=fa-IR`,
            { next: { revalidate: 3600 } },
          );
          titleDetails.set(key, response.ok ? ((await response.json()) as TmdbTitle) : null);
        } catch {
          titleDetails.set(key, null);
        }
      }),
    );
  }

  const watchCounts = new Map<string, number>();
  for (const row of diary) {
    const key = titleKey(row.title_id, row.title_type);
    watchCounts.set(key, (watchCounts.get(key) || 0) + 1);
  }

  const rewatchCount = [...watchCounts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_78%_5%,rgba(37,99,235,.14),transparent_30%),radial-gradient(circle_at_22%_0%,rgba(124,58,237,.12),transparent_26%)]">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-400 hover:text-white">
            <ChevronRight className="h-4 w-4" /> بازگشت به داشبورد
          </Link>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-200">
                <Sparkles className="h-4 w-4" /> فقط برای تو
              </div>
              <h1 className="mt-4 text-3xl font-black sm:text-4xl">امتیازها و دفترچه تماشای من</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                امتیازهای فیلم‌ترک، تاریخ‌های تماشا و بازتماشاهای تو در این صفحه خصوصی می‌مانند.
              </p>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <Star className="h-4 w-4 text-amber-300" />
              <p className="mt-3 text-2xl font-black">{ratings.length.toLocaleString("fa-IR")}</p>
              <p className="mt-1 text-xs text-slate-500">امتیاز شخصی</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <CalendarDays className="h-4 w-4 text-blue-300" />
              <p className="mt-3 text-2xl font-black">{diary.length.toLocaleString("fa-IR")}</p>
              <p className="mt-1 text-xs text-slate-500">ثبت تماشا</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <RotateCcw className="h-4 w-4 text-violet-300" />
              <p className="mt-3 text-2xl font-black">{rewatchCount.toLocaleString("fa-IR")}</p>
              <p className="mt-1 text-xs text-slate-500">بازتماشا</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        {readFailed ? (
          <div className="lg:col-span-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100" role="alert">
            خواندن تاریخچه موقتاً با خطا روبه‌رو شد. هیچ داده‌ای تغییر نکرده است.
          </div>
        ) : null}

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">امتیازهای من</h2>
              <p className="mt-1 text-xs text-slate-500">امتیاز شخصی فیلم‌ترک؛ مستقل از امتیاز تجمیعی مرجع.</p>
            </div>
            <Star className="h-5 w-5 text-amber-300" />
          </div>

          {ratings.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-center">
              <Film className="mx-auto h-7 w-7 text-blue-300" />
              <p className="mt-3 font-bold">هنوز امتیازی ثبت نکرده‌ای</p>
              <Link href="/movies" className="mt-4 inline-flex"><Button className="rounded-xl">کشف فیلم‌ها</Button></Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {ratings.map((row) => {
                const details = titleDetails.get(titleKey(row.title_id, row.title_type)) || null;
                return (
                  <Link key={row.id} href={`/title/${row.title_id}?type=${row.title_type}`} className="flex gap-3 rounded-2xl border border-white/10 bg-[#0b1220]/80 p-3 transition hover:border-blue-400/30">
                    <div className="h-20 w-14 flex-none overflow-hidden rounded-lg bg-white/[0.04]">
                      {details?.poster_path ? <TmdbImage src={`https://image.tmdb.org/t/p/w200${details.poster_path}`} alt={`پوستر ${titleName(details, row.title_id)}`} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black">{titleName(details, row.title_id)}</p>
                      <p className="mt-1 text-xs text-slate-500">{row.title_type === "tv" ? "سریال" : "فیلم"}</p>
                      <p className="mt-3 inline-flex items-center gap-1 text-sm font-black text-amber-300"><Star className="h-4 w-4 fill-current" /> {row.rating_10.toLocaleString("fa-IR")} از ۱۰</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">دفترچه تماشا</h2>
              <p className="mt-1 text-xs text-slate-500">هر ثبت جداست؛ تکرار یک عنوان به‌صورت بازتماشا محاسبه می‌شود.</p>
            </div>
            <CalendarDays className="h-5 w-5 text-blue-300" />
          </div>

          {diary.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-center">
              <CalendarDays className="mx-auto h-7 w-7 text-blue-300" />
              <p className="mt-3 font-bold">دفترچه‌ات هنوز خالی است</p>
              <p className="mt-2 text-sm text-slate-500">از صفحه هر عنوان، تاریخ تماشا را ثبت کن.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {diary.map((row) => {
                const key = titleKey(row.title_id, row.title_type);
                const details = titleDetails.get(key) || null;
                const totalWatches = watchCounts.get(key) || 1;
                return (
                  <Link key={row.id} href={`/title/${row.title_id}?type=${row.title_type}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1220]/80 p-3 transition hover:border-violet-400/30">
                    <div className="h-20 w-14 flex-none overflow-hidden rounded-lg bg-white/[0.04]">
                      {details?.poster_path ? <TmdbImage src={`https://image.tmdb.org/t/p/w200${details.poster_path}`} alt={`پوستر ${titleName(details, row.title_id)}`} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black">{titleName(details, row.title_id)}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatPersianDate(row.watched_on)}</p>
                      {totalWatches > 1 ? (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-1 text-[11px] font-bold text-violet-200"><RotateCcw className="h-3 w-3" /> {totalWatches.toLocaleString("fa-IR")} بار تماشا</span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
