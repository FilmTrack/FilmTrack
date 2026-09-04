import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, CheckCircle2, Eye, Film, Globe2, PauseCircle, PlayCircle, Sparkles, UserRound, Users, XCircle } from "lucide-react";

import ListVisibilityToggle from "@/components/ListVisibilityToggle";
import TmdbImage from "@/components/TmdbImage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { isCommunityRuntimeEnabled } from "@/lib/m3/readiness";
import { createClient } from "@/lib/supabase/server";
import { USER_LIST_STATUSES, type UserListStatus } from "@/lib/user-lists/types";

type CommunityDashboardProfile = {
  username: string;
  display_name: string | null;
  visibility: "private" | "public";
};

const STATUS_META: Record<UserListStatus, { label: string; icon: typeof Eye }> = {
  plan_to_watch: { label: "در صف تماشا", icon: Eye },
  watching: { label: "در حال تماشا", icon: PlayCircle },
  completed: { label: "تماشا شده", icon: CheckCircle2 },
  on_hold: { label: "متوقف موقت", icon: PauseCircle },
  dropped: { label: "رها شده", icon: XCircle },
};

function isUserListStatus(value: string | undefined): value is UserListStatus {
  return Boolean(value && USER_LIST_STATUSES.includes(value as UserListStatus));
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: requestedStatus } = await searchParams;
  const activeStatus = isUserListStatus(requestedStatus) ? requestedStatus : null;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect("/auth");

  const { data: { user } } = await supabase.auth.getUser();
  const { data: userLists } = await supabase
    .from("user_lists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const communityEnabled = isCommunityRuntimeEnabled();
  let communityProfile: CommunityDashboardProfile | null = null;

  if (communityEnabled) {
    const { data } = await supabase
      .from("community_profiles")
      .select("username,display_name,visibility")
      .eq("user_id", userId)
      .maybeSingle();

    communityProfile = data as unknown as CommunityDashboardProfile | null;
  }

  const apiKey = process.env.TMDB_API_KEY;
  const fetchTMDBDetails = async (id: number, type: string) => {
    if (!apiKey) return null;
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=fa-IR`,
        { next: { revalidate: 3600 } },
      );
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  };

  const watchList = userLists || [];
  const filteredWatchList = activeStatus
    ? watchList.filter((item) => item.status === activeStatus)
    : watchList;
  const tmdbResults = await Promise.all(
    filteredWatchList.map((item) => fetchTMDBDetails(item.title_id, item.title_type)),
  );

  const combinedList = filteredWatchList
    .map((item, index) => ({ db: item, tmdb: tmdbResults[index] }))
    .filter((item) => item.tmdb !== null);

  const stats = [
    { label: "همه عنوان‌ها", value: watchList.length.toString(), icon: Film },
    { label: "در حال تماشا", value: watchList.filter((i) => i.status === "watching").length.toString(), icon: PlayCircle },
    { label: "تماشا شده", value: watchList.filter((i) => i.status === "completed").length.toString(), icon: CheckCircle2 },
    { label: "عمومی", value: watchList.filter((i) => i.is_public === true).length.toString(), icon: Globe2 },
  ];

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_78%_5%,rgba(37,99,235,.14),transparent_30%),radial-gradient(circle_at_22%_0%,rgba(124,58,237,.12),transparent_26%)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-200">
                <Sparkles className="h-4 w-4" /> فضای شخصی تو
              </div>
              <h1 className="mt-4 text-3xl font-black sm:text-4xl">داشبورد تماشای من</h1>
              <p className="mt-2 text-sm leading-7 text-slate-400">فهرست‌ها، وضعیت تماشا و مسیر شخصی خودت را از همین‌جا مدیریت کن.</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <Avatar className="h-11 w-11 border border-blue-400/30">
                <AvatarFallback className="bg-blue-500/10 font-black text-blue-300">{user?.email?.[0]?.toUpperCase() || "F"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">حساب فعال</p>
                <p dir="ltr" className="max-w-52 truncate text-sm font-bold text-white">{user?.email || "FilmTrack"}</p>
              </div>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <Icon className="h-4 w-4 text-blue-300" />
                    <span className="text-2xl font-black text-white">{stat.value}</span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-400">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8">
        <section className="min-w-0">
          {communityEnabled ? (
            communityProfile ? (
              <div className="mb-6 rounded-3xl border border-violet-400/15 bg-[linear-gradient(135deg,rgba(124,58,237,.12),rgba(37,99,235,.08))] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10">
                      <Users className="h-5 w-5 text-violet-200" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">شبکه FilmTrack تو آماده است</p>
                      <p className="mt-1 text-xs leading-6 text-slate-400">
                        {communityProfile.display_name || `@${communityProfile.username}`} · {communityProfile.visibility === "public" ? "پروفایل عمومی" : "پروفایل خصوصی"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/community"><Button size="sm" className="rounded-xl bg-violet-600 text-white hover:bg-violet-500">کشف اعضا</Button></Link>
                    <Link href="/dashboard/community"><Button size="sm" variant="outline" className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">شبکه من</Button></Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6 rounded-3xl border border-blue-400/20 bg-blue-500/[0.07] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
                      <Users className="h-5 w-5 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">پروفایل اجتماعی FilmTrack را بساز</p>
                      <p className="mt-1 max-w-xl text-xs leading-6 text-slate-400">یک username انتخاب کن تا بتوانی اعضای عمومی را پیدا کنی، دنبال کنی و فعالیت‌های عمومی خودت را با کنترل کامل حریم خصوصی نمایش بدهی.</p>
                    </div>
                  </div>
                  <Link href="/dashboard/profile">
                    <Button className="min-h-11 rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 px-5 font-black text-white">ساخت پروفایل</Button>
                  </Link>
                </div>
              </div>
            )
          ) : null}

          <div className="mb-5 flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-black sm:text-2xl">فهرست تماشای تو</h2>
              <p className="mt-2 text-xs leading-6 text-slate-500">هر پنج وضعیت استاندارد FilmTrack اینجا دقیق و قابل فیلتر هستند.</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" aria-label="فیلتر وضعیت تماشا">
              <Link href="/dashboard" className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-bold transition ${activeStatus === null ? "border-blue-400/40 bg-blue-500/15 text-blue-100" : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"}`}>همه ({watchList.length.toLocaleString("fa-IR")})</Link>
              {USER_LIST_STATUSES.map((status) => (
                <Link key={status} href={`/dashboard?status=${status}`} className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-bold transition ${activeStatus === status ? "border-blue-400/40 bg-blue-500/15 text-blue-100" : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"}`}>
                  {STATUS_META[status].label} ({watchList.filter((item) => item.status === status).length.toLocaleString("fa-IR")})
                </Link>
              ))}
            </div>
          </div>

          {combinedList.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <Film className="mx-auto h-7 w-7 text-blue-300" />
              <p className="mt-3 font-bold">{activeStatus ? `در وضعیت «${STATUS_META[activeStatus].label}» عنوانی نداری` : "فهرستت هنوز خالی است"}</p>
              <p className="mt-2 text-sm text-slate-500">{activeStatus ? "یک وضعیت دیگر را انتخاب کن یا عنوانی را از صفحه فیلم/سریال به این وضعیت ببر." : "چند فیلم یا سریال پیدا کن و اولین مسیر تماشایت را بساز."}</p>
              <Link href={activeStatus ? "/dashboard" : "/movies"} className="mt-5 inline-flex">
                <Button className="min-h-11 rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 px-5 font-bold text-white">{activeStatus ? "نمایش همه عنوان‌ها" : "شروع کاوش"}</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {combinedList.map(({ db, tmdb }) => {
                const status = isUserListStatus(db.status) ? db.status : "plan_to_watch";
                const StatusIcon = STATUS_META[status].icon;
                return (
                  <article key={db.id} className="rounded-2xl border border-white/10 bg-[#0b1220]/80 p-3 transition hover:border-blue-400/25 sm:p-4">
                    <div className="flex gap-3 sm:gap-4">
                      <Link href={`/title/${db.title_id}?type=${db.title_type}`} className="h-28 w-20 flex-none overflow-hidden rounded-xl bg-white/[0.04] sm:h-36 sm:w-24">
                        {tmdb.poster_path && <TmdbImage src={`https://image.tmdb.org/t/p/w500${tmdb.poster_path}`} alt={tmdb.title || tmdb.name} className="h-full w-full object-cover" />}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/title/${db.title_id}?type=${db.title_type}`}><h3 className="truncate text-base font-black sm:text-lg">{tmdb.title || tmdb.name}</h3></Link>
                        <p className="mt-1 text-xs text-slate-500">{db.title_type === "tv" ? "سریال" : "فیلم"} · {tmdb.release_date ? new Date(tmdb.release_date).getFullYear() : tmdb.first_air_date ? new Date(tmdb.first_air_date).getFullYear() : "—"}</p>
                        <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-blue-400/15 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-300"><StatusIcon className="h-3.5 w-3.5" />{STATUS_META[status].label}</span>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <ListVisibilityToggle id={db.id} initialPublic={db.is_public === true} />
                          <Link href={`/title/${db.title_id}?type=${db.title_type}`}><Button size="sm" variant="outline" className="rounded-xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07]">مشاهده و ویرایش</Button></Link>
                          {db.title_type === "tv" && <Link href={`/title/${db.title_id}/episodes`}><Button size="sm" variant="outline" className="rounded-xl border-blue-400/20 bg-blue-500/10 text-blue-200 hover:bg-blue-500/15">رهگیری قسمت‌ها</Button></Link>}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-white/10 bg-[#0b1220]/90 p-5">
            <h2 className="text-sm font-black">میانبرهای حساب</h2>
            <div className="mt-4 grid gap-2">
              <Link href="/dashboard/continue"><Button className="min-h-11 w-full justify-start rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 text-white"><PlayCircle className="ml-2 h-4 w-4" /> ادامه تماشا</Button></Link>
              <Link href="/dashboard/profile"><Button variant="outline" className="min-h-11 w-full justify-start rounded-xl border-violet-400/20 bg-violet-500/10 text-violet-100 hover:bg-violet-500/15"><UserRound className="ml-2 h-4 w-4" /> پروفایل من</Button></Link>
              {communityEnabled && communityProfile ? <><Link href="/community"><Button variant="outline" className="min-h-11 w-full justify-start rounded-xl border-blue-400/20 bg-blue-500/10 text-blue-100 hover:bg-blue-500/15"><Users className="ml-2 h-4 w-4" /> کشف اعضا</Button></Link><Link href="/dashboard/community"><Button variant="outline" className="min-h-11 w-full justify-start rounded-xl border-white/10 bg-white/[0.03] text-white"><Users className="ml-2 h-4 w-4" /> شبکه من</Button></Link></> : null}
              {communityProfile?.visibility === "public" ? <Link href={`/u/${encodeURIComponent(communityProfile.username)}`}><Button variant="outline" className="min-h-11 w-full justify-start rounded-xl border-white/10 bg-white/[0.03] text-white"><Globe2 className="ml-2 h-4 w-4" /> پروفایل عمومی</Button></Link> : null}
              <Link href="/calendar"><Button variant="outline" className="min-h-11 w-full justify-start rounded-xl border-white/10 bg-white/[0.03] text-white"><CalendarDays className="ml-2 h-4 w-4" /> تقویم انتشار</Button></Link>
              <Link href="/movies"><Button variant="outline" className="min-h-11 w-full justify-start rounded-xl border-white/10 bg-white/[0.03] text-white"><Film className="ml-2 h-4 w-4" /> کشف فیلم‌ها</Button></Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
