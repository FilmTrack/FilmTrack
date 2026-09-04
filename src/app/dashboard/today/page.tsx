import Link from "next/link";
import { Bell, CalendarDays, ChartNoAxesColumnIncreasing, Clock3, History, PlayCircle, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { groupPersonalCalendar, type PersonalCalendarEvent } from "@/lib/personal-calendar";
import { createClient } from "@/lib/supabase/server";
import { fetchJson } from "@/lib/tmdb";

export const metadata = {
  title: "امروز من | FilmTrack",
  description: "مرکز روزانه و خصوصی FilmTrack برای ادامه تماشا، قسمت‌های آینده و پیشنهادهای شخصی.",
  robots: { index: false, follow: false },
};

type TmdbTvDetails = {
  id: number;
  name?: string;
  next_episode_to_air?: {
    air_date?: string | null;
    episode_number?: number;
    name?: string;
    season_number?: number;
  } | null;
};

type UserListRow = {
  id: string;
  title_id: number;
  title_type: "movie" | "tv";
  status: string;
  created_at?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  plan_to_watch: "در صف تماشا",
  watching: "در حال تماشا",
  completed: "تماشا شده",
  on_hold: "متوقف موقت",
  dropped: "رها شده",
};

export default async function TodayPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth");

  const { data: listRows, error: listError } = await supabase
    .from("user_lists")
    .select("id,title_id,title_type,status,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const rows = (listRows ?? []) as UserListRow[];
  const watching = rows.filter((row) => row.status === "watching");
  const watchingTvIds = [...new Set(watching.filter((row) => row.title_type === "tv").map((row) => row.title_id))];

  const apiKey = process.env.TMDB_API_KEY;
  const details = apiKey
    ? await Promise.all(
        watchingTvIds.slice(0, 20).map((titleId) =>
          fetchJson<TmdbTvDetails>(
            `https://api.themoviedb.org/3/tv/${titleId}?api_key=${apiKey}&language=fa-IR`,
            { next: { revalidate: 1800 } },
          ),
        ),
      )
    : [];

  const events: PersonalCalendarEvent[] = details.flatMap((item) => {
    const next = item?.next_episode_to_air;
    if (!item || !next?.air_date || !next.season_number || !next.episode_number) return [];
    return [{
      titleId: item.id,
      titleName: item.name || `سریال ${item.id}`,
      seasonNumber: next.season_number,
      episodeNumber: next.episode_number,
      episodeName: next.name,
      airDate: next.air_date,
      href: `/title/${item.id}/episodes?season=${next.season_number}`,
    }];
  });

  const calendar = groupPersonalCalendar(events);
  const nearEvents = [...calendar.today, ...calendar.thisWeek].slice(0, 4);
  const recent = rows.slice(0, 5);
  const isColdStart = rows.length === 0;

  return (
    <main className="min-h-screen bg-[#050914] px-4 pb-16 pt-24 text-white" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_80%_0%,rgba(37,99,235,.14),transparent_35%),radial-gradient(circle_at_20%_10%,rgba(124,58,237,.12),transparent_32%)] p-6 sm:p-8">
          <p className="text-xs font-black text-blue-300">FILMTRACK TODAY</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">امروز برای تو</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
            ادامه تماشا، قسمت‌های نزدیک، پیشنهادهای شخصی و میانبرهای مهم حساب تو؛ در یک صفحه خصوصی و روزانه.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-2xl font-black">{rows.length.toLocaleString("fa-IR")}</p><p className="mt-1 text-xs text-slate-400">همه عنوان‌ها</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-2xl font-black">{watching.length.toLocaleString("fa-IR")}</p><p className="mt-1 text-xs text-slate-400">در حال تماشا</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-2xl font-black">{calendar.today.length.toLocaleString("fa-IR")}</p><p className="mt-1 text-xs text-slate-400">قسمت امروز</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-2xl font-black">{calendar.thisWeek.length.toLocaleString("fa-IR")}</p><p className="mt-1 text-xs text-slate-400">این هفته</p></div>
          </div>
        </header>

        {listError ? (
          <section className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm leading-7 text-red-100">
            فعلاً نتوانستیم داده‌های شخصی تو را بخوانیم. هیچ داده عمومی نشده است؛ کمی بعد دوباره تلاش کن.
          </section>
        ) : isColdStart ? (
          <section className="rounded-3xl border border-blue-400/20 bg-blue-500/[0.07] p-6 sm:p-8">
            <Sparkles className="h-7 w-7 text-blue-300" />
            <h2 className="mt-4 text-2xl font-black">FilmTrack را با سلیقه خودت شروع کن</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">چند فیلم یا سریال را به فهرستت اضافه کن. بعد از همان داده‌های خودت، تقویم، Taste DNA و پیشنهادهای شخصی شکل می‌گیرند.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/discover" className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-black text-white">کشف فارسی</Link>
              <Link href="/dashboard/import" className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white">انتقال تاریخچه</Link>
            </div>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><PlayCircle className="h-5 w-5 text-blue-300" /><h2 className="text-lg font-black">ادامه تماشا</h2></div><Link href="/dashboard?status=watching" className="text-xs font-bold text-blue-300">همه</Link></div>
              {watching.length ? <div className="mt-4 grid gap-2">{watching.slice(0, 5).map((row) => <Link key={row.id} href={`/title/${row.title_id}?type=${row.title_type}`} className="rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm font-bold transition hover:border-blue-400/25">{row.title_type === "tv" ? "سریال" : "فیلم"} #{row.title_id} <span className="mr-2 text-xs text-slate-500">ادامه</span></Link>)}</div> : <p className="mt-4 text-sm leading-7 text-slate-500">فعلاً عنوانی در وضعیت «در حال تماشا» نداری.</p>}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-violet-300" /><h2 className="text-lg font-black">قسمت‌های نزدیک</h2></div><Link href="/dashboard/calendar" className="text-xs font-bold text-blue-300">تقویم کامل</Link></div>
              {nearEvents.length ? <div className="mt-4 grid gap-2">{nearEvents.map((event) => <Link key={`${event.titleId}-${event.seasonNumber}-${event.episodeNumber}`} href={event.href} className="rounded-xl border border-white/10 bg-black/15 px-4 py-3 transition hover:border-violet-400/25"><p className="text-sm font-black">{event.titleName}</p><p className="mt-1 text-xs text-slate-500">فصل {event.seasonNumber} · قسمت {event.episodeNumber} · {event.airDate}</p></Link>)}</div> : <p className="mt-4 text-sm leading-7 text-slate-500">برای هفت روز آینده قسمت اعلام‌شده‌ای پیدا نشد.</p>}
            </section>
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/recommendations" className="rounded-2xl border border-violet-400/15 bg-violet-500/[0.06] p-5 transition hover:bg-violet-500/10"><Sparkles className="h-5 w-5 text-violet-300" /><p className="mt-3 font-black">چی ببینم؟</p><p className="mt-1 text-xs leading-6 text-slate-500">Recommendation v2 بر پایه Taste DNA و موقعیت تو</p></Link>
          <Link href="/dashboard/stats" className="rounded-2xl border border-blue-400/15 bg-blue-500/[0.06] p-5 transition hover:bg-blue-500/10"><ChartNoAxesColumnIncreasing className="h-5 w-5 text-blue-300" /><p className="mt-3 font-black">Taste DNA و آمار</p><p className="mt-1 text-xs leading-6 text-slate-500">الگوی واقعی سلیقه و رفتار تماشای تو</p></Link>
          <Link href="/dashboard/notifications" className="rounded-2xl border border-amber-400/15 bg-amber-500/[0.05] p-5 transition hover:bg-amber-500/10"><Bell className="h-5 w-5 text-amber-300" /><p className="mt-3 font-black">اعلان‌ها</p><p className="mt-1 text-xs leading-6 text-slate-500">قسمت‌ها، فصل‌ها و تغییرات مرتبط با فهرست تو</p></Link>
          <Link href="/dashboard/history" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]"><History className="h-5 w-5 text-emerald-300" /><p className="mt-3 font-black">تاریخچه من</p><p className="mt-1 text-xs leading-6 text-slate-500">امتیازها، Diary و Rewatchهای شخصی</p></Link>
        </section>

        {!isColdStart && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-slate-300" /><h2 className="text-lg font-black">آخرین تغییرهای فهرست تو</h2></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{recent.map((row) => <Link key={row.id} href={`/title/${row.title_id}?type=${row.title_type}`} className="rounded-xl border border-white/10 bg-black/15 p-3"><p className="text-xs font-black">{row.title_type === "tv" ? "سریال" : "فیلم"} #{row.title_id}</p><p className="mt-1 text-[11px] text-slate-500">{STATUS_LABELS[row.status] || row.status}</p></Link>)}</div>
          </section>
        )}
      </div>
    </main>
  );
}
