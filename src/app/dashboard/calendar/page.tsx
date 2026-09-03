import Link from "next/link";
import { CalendarDays, Clock3, Tv2 } from "lucide-react";
import { redirect } from "next/navigation";

import {
  formatPersianCalendarDate,
  groupPersonalCalendar,
  type PersonalCalendarEvent,
} from "@/lib/personal-calendar";
import { createClient } from "@/lib/supabase/server";
import { fetchJson } from "@/lib/tmdb";

export const metadata = {
  title: "تقویم شخصی | FilmTrack",
  description: "قسمت‌ها و فصل‌های بعدی سریال‌هایی که دنبال می‌کنی.",
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

function EventCard({ event }: { event: PersonalCalendarEvent }) {
  return (
    <Link
      href={event.href}
      className="group block rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-blue-400/30 hover:bg-blue-500/[0.06]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-black text-white group-hover:text-blue-200">
            {event.titleName}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-400">
            فصل {event.seasonNumber} · قسمت {event.episodeNumber}
            {event.episodeName ? ` · ${event.episodeName}` : ""}
          </p>
          <p className="mt-2 text-xs font-bold text-blue-300">
            {formatPersianCalendarDate(event.airDate)}
          </p>
        </div>
        <Tv2 className="mt-1 h-5 w-5 shrink-0 text-violet-300" />
      </div>
    </Link>
  );
}

function Section({ title, events }: { title: string; events: PersonalCalendarEvent[] }) {
  if (events.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-blue-300" />
        <h2 className="text-lg font-black text-white">{title}</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">{events.map((event) => <EventCard key={`${event.titleId}-${event.seasonNumber}-${event.episodeNumber}`} event={event} />)}</div>
    </section>
  );
}

export default async function PersonalCalendarPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth");

  const { data: trackedRows, error: trackingError } = await supabase
    .from("user_lists")
    .select("title_id, title_type, status")
    .eq("user_id", userId)
    .eq("title_type", "tv")
    .eq("status", "watching");

  const apiKey = process.env.TMDB_API_KEY;

  if (trackingError) {
    return (
      <main className="min-h-screen bg-[#050914] px-4 pb-16 pt-24 text-white" dir="rtl">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-400/20 bg-red-500/10 p-6">
          <h1 className="text-2xl font-black">تقویم شخصی</h1>
          <p className="mt-3 text-sm leading-7 text-red-100">فعلاً نتوانستیم فهرست سریال‌های در حال تماشای تو را بخوانیم. کمی بعد دوباره تلاش کن.</p>
        </div>
      </main>
    );
  }

  const titleIds = [...new Set((trackedRows ?? []).map((row) => row.title_id).filter((id): id is number => Number.isInteger(id) && id > 0))];

  if (!apiKey || titleIds.length === 0) {
    return (
      <main className="min-h-screen bg-[#050914] px-4 pb-16 pt-24 text-white" dir="rtl">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7 text-center">
            <Clock3 className="mx-auto h-8 w-8 text-blue-300" />
            <h1 className="mt-4 text-3xl font-black">تقویم شخصی</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">
              هنوز سریالی با وضعیت «در حال تماشا» نداری. وقتی یک سریال را شروع کنی، قسمت بعدی آن اینجا ظاهر می‌شود.
            </p>
            <Link href="/shows" className="mt-5 inline-flex rounded-xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-400">پیدا کردن سریال</Link>
          </div>
        </div>
      </main>
    );
  }

  const details = await Promise.all(titleIds.map((titleId) => fetchJson<TmdbTvDetails>(
    `https://api.themoviedb.org/3/tv/${titleId}?api_key=${apiKey}&language=fa-IR`,
    { next: { revalidate: 1800 } },
  )));

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

  const groups = groupPersonalCalendar(events);
  const hasEvents = groups.today.length + groups.thisWeek.length + groups.later.length > 0;

  return (
    <main className="min-h-screen bg-[#050914] px-4 pb-16 pt-24 text-white" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <p className="text-xs font-black text-blue-300">FILMTRACK DAILY HABIT</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">تقویم شخصی من</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">قسمت بعدی سریال‌هایی که در حال تماشایشان هستی؛ مرتب‌شده برای امروز، این هفته و بعدتر.</p>
        </header>

        {hasEvents ? (
          <div className="space-y-8">
            <Section title="امروز" events={groups.today} />
            <Section title="این هفته" events={groups.thisWeek} />
            <Section title="بعدتر" events={groups.later} />
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
            <p className="font-black text-white">فعلاً قسمت آینده‌ای ثبت نشده است.</p>
            <p className="mt-2 text-sm leading-7 text-slate-400">ممکن است سریال‌ها بین فصل‌ها باشند یا تاریخ پخش قسمت بعدی هنوز اعلام نشده باشد.</p>
          </div>
        )}
      </div>
    </main>
  );
}
