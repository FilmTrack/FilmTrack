import Link from "next/link";
import { Bell, CalendarDays, Tv2 } from "lucide-react";
import { redirect } from "next/navigation";

import { buildNotificationInbox } from "@/lib/notifications";
import { formatPersianCalendarDate, groupPersonalCalendar, type PersonalCalendarEvent } from "@/lib/personal-calendar";
import { createClient } from "@/lib/supabase/server";
import { fetchJson } from "@/lib/tmdb";

export const metadata = {
  title: "اعلان‌های من | FilmTrack",
  description: "قسمت‌ها و فصل‌های آینده مرتبط با فهرست شخصی تو.",
  robots: { index: false, follow: false },
};

type TmdbTvDetails = {
  id: number;
  name?: string;
  next_episode_to_air?: { air_date?: string | null; episode_number?: number; name?: string; season_number?: number } | null;
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth");

  const { data: trackedRows, error: trackingError } = await supabase
    .from("user_lists")
    .select("title_id,title_type,status")
    .eq("user_id", userId)
    .eq("title_type", "tv")
    .eq("status", "watching");

  if (trackingError) {
    return <main className="min-h-screen bg-[#050914] px-4 pb-16 pt-24 text-white" dir="rtl"><div className="mx-auto max-w-5xl rounded-2xl border border-red-400/20 bg-red-500/10 p-6"><h1 className="text-2xl font-black">اعلان‌های من</h1><p className="mt-3 text-sm leading-7 text-red-100">فعلاً نتوانستیم اعلان‌های مرتبط با فهرست شخصی تو را بسازیم. کمی بعد دوباره تلاش کن.</p></div></main>;
  }

  const apiKey = process.env.TMDB_API_KEY;
  const titleIds = [...new Set((trackedRows ?? []).map((row) => row.title_id).filter((id): id is number => Number.isInteger(id) && id > 0))];
  const details = apiKey ? await Promise.all(titleIds.slice(0, 40).map((titleId) => fetchJson<TmdbTvDetails>(`https://api.themoviedb.org/3/tv/${titleId}?api_key=${apiKey}&language=fa-IR`, { next: { revalidate: 1800 } }))) : [];

  const events: PersonalCalendarEvent[] = details.flatMap((item) => {
    const next = item?.next_episode_to_air;
    if (!item || !next?.air_date || !next.season_number || !next.episode_number) return [];
    return [{ titleId: item.id, titleName: item.name || `سریال ${item.id}`, seasonNumber: next.season_number, episodeNumber: next.episode_number, episodeName: next.name, airDate: next.air_date, href: `/title/${item.id}/episodes?season=${next.season_number}` }];
  });

  const groups = groupPersonalCalendar(events);
  const inbox = buildNotificationInbox([...groups.today, ...groups.thisWeek, ...groups.later]);

  return (
    <main className="min-h-screen bg-[#050914] px-4 pb-16 pt-24 text-white" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_80%_5%,rgba(245,158,11,.12),transparent_34%),radial-gradient(circle_at_20%_0%,rgba(124,58,237,.1),transparent_30%)] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-amber-300"><Bell className="h-5 w-5" /><span className="text-xs font-black">FILMTRACK INBOX</span></div>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">اعلان‌های من</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">صندوق ورودی خصوصی برای قسمت‌ها و فصل‌های آینده سریال‌هایی که واقعاً در حال تماشایشان هستی.</p>
          <p className="mt-3 text-xs leading-6 text-slate-500">نسخه فعلی اعلان‌ها را هنگام بازکردن صفحه از داده‌های خودت می‌سازد؛ هیچ سرویس Push یا ایمیل پولی فعال نشده است.</p>
        </header>
        {inbox.length === 0 ? (
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center"><Bell className="mx-auto h-8 w-8 text-amber-300" /><h2 className="mt-4 text-xl font-black">فعلاً اعلان تازه‌ای نداری</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-500">وقتی برای سریال‌های در حال تماشای تو قسمت یا فصل آینده ثبت شود، اینجا ظاهر می‌شود.</p><div className="mt-5 flex flex-wrap justify-center gap-3"><Link href="/dashboard/calendar" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold">تقویم شخصی</Link><Link href="/shows" className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-black">کشف سریال</Link></div></section>
        ) : (
          <section className="space-y-3">{inbox.map((item) => <Link key={item.id} href={item.href} className="block rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-amber-400/25 hover:bg-amber-500/[0.04]"><div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/15 bg-amber-500/10 px-2.5 py-1 text-[11px] font-black text-amber-200">{item.kind === "season_premiere" ? <CalendarDays className="h-3.5 w-3.5" /> : <Tv2 className="h-3.5 w-3.5" />}{item.kind === "season_premiere" ? "شروع فصل" : "قسمت جدید"}</div><h2 className="text-base font-black">{item.title}</h2><p className="mt-1 text-sm leading-6 text-slate-400">{item.description}</p><p className="mt-2 text-xs font-bold text-blue-300">{formatPersianCalendarDate(item.eventDate)}</p></Link>)}</section>
        )}
      </div>
    </main>
  );
}
