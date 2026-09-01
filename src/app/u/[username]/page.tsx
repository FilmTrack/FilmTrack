import Link from "next/link";
import { ArrowRight, Clock3, LockKeyhole, UserRound } from "lucide-react";
import { notFound } from "next/navigation";

import CommunityFollowButton from "@/components/CommunityFollowButton";
import TmdbImage from "@/components/TmdbImage";
import { isCommunityRuntimeEnabled } from "@/lib/m3/readiness";
import { createClient } from "@/lib/supabase/server";

type CommunityProfileRow = {
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
};

type PublicListRow = {
  id: number;
  title_id: number;
  title_type: "movie" | "tv";
  status: "plan_to_watch" | "watching" | "completed" | "on_hold" | "dropped";
  created_at: string;
};

type TmdbTitle = {
  title?: string;
  name?: string;
  poster_path?: string | null;
};

const STATUS_LABELS: Record<PublicListRow["status"], string> = {
  plan_to_watch: "برای بعد",
  watching: "در حال تماشا",
  completed: "تماشا شده",
  on_hold: "متوقف موقت",
  dropped: "رها شده",
};

async function fetchTmdbTitle(
  apiKey: string | undefined,
  titleId: number,
  titleType: PublicListRow["title_type"],
): Promise<TmdbTitle | null> {
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/${titleType}/${titleId}?api_key=${apiKey}&language=fa-IR`,
      { next: { revalidate: 3600 } },
    );

    if (!response.ok) return null;
    return (await response.json()) as TmdbTitle;
  } catch {
    return null;
  }
}

export default async function CommunityPublicProfile({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: rawUsername } = await params;
  const username = rawUsername.trim().toLowerCase();
  const enabled = isCommunityRuntimeEnabled();

  if (!enabled) {
    return (
      <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
        <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-16 sm:px-6">
          <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <LockKeyhole className="h-8 w-8 text-violet-300" />
            <h1 className="mt-5 text-2xl font-black">پروفایل اجتماعی هنوز فعال نیست</h1>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              این مسیر پشت Feature Flag قرار دارد و تا زمان تأیید زیرساخت Community هیچ دسترسی‌ای به جدول‌های M3 انجام نمی‌دهد.
            </p>
            <Link href="/" className="mt-6 inline-flex items-center text-sm font-bold text-blue-300 hover:text-blue-200">
              <ArrowRight className="ml-2 h-4 w-4" /> بازگشت به FilmTrack
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const viewerUserId = claimsData?.claims?.sub;

  // The M3 foundation deliberately grants no anonymous reads. Keep the public
  // identity route username-based, while requiring sign-in until a later,
  // separately-reviewed anonymous visibility policy is approved.
  if (!viewerUserId) {
    return (
      <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
        <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-16 sm:px-6">
          <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <UserRound className="h-8 w-8 text-blue-300" />
            <h1 className="mt-5 text-2xl font-black">برای دیدن پروفایل اجتماعی وارد شو</h1>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              در این مرحله پروفایل‌های عمومی فقط برای اعضای واردشده FilmTrack قابل مشاهده‌اند.
            </p>
            <Link href="/auth" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-black hover:bg-blue-500">
              ورود به حساب
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const { data: profileData, error: profileError } = await supabase
    .from("community_profiles")
    .select("user_id,username,display_name,bio")
    .eq("username", username)
    .eq("visibility", "public")
    .maybeSingle();

  if (profileError || !profileData) notFound();

  const profile = profileData as unknown as CommunityProfileRow;
  const isOwnProfile = profile.user_id === viewerUserId;
  let following = false;

  if (!isOwnProfile) {
    const { data: followEdge } = await supabase
      .from("community_follows")
      .select("followed_user_id")
      .eq("follower_user_id", viewerUserId)
      .eq("followed_user_id", profile.user_id)
      .maybeSingle();

    following = Boolean(followEdge);
  }

  // user_lists has an explicit public-read RLS policy keyed by is_public=true.
  // Ratings and diary entries remain owner-only and are intentionally excluded.
  const { data: publicListData } = await supabase
    .from("user_lists")
    .select("id,title_id,title_type,status,created_at")
    .eq("user_id", profile.user_id)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(12);

  const publicList = (publicListData ?? []) as unknown as PublicListRow[];
  const tmdbTitles = await Promise.all(
    publicList.map((item) =>
      fetchTmdbTitle(process.env.TMDB_API_KEY, item.title_id, item.title_type),
    ),
  );
  const publicActivity = publicList.map((item, index) => ({
    item,
    title: tmdbTitles[index],
  }));

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_80%_0%,rgba(37,99,235,.16),transparent_34%),radial-gradient(circle_at_20%_0%,rgba(124,58,237,.14),transparent_30%)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Link href="/" className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white">
            <ArrowRight className="ml-2 h-4 w-4" /> FilmTrack
          </Link>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-200">
                <UserRound className="h-4 w-4" /> عضو FilmTrack
              </div>
              <h1 className="mt-4 text-3xl font-black sm:text-5xl">
                {profile.display_name || `@${profile.username}`}
              </h1>
              <p className="mt-2 text-sm font-bold text-blue-300" dir="ltr">
                @{profile.username}
              </p>
              {profile.bio ? (
                <p className="mt-5 max-w-xl text-sm leading-8 text-slate-300 sm:text-base">
                  {profile.bio}
                </p>
              ) : (
                <p className="mt-5 text-sm text-slate-500">این عضو هنوز توضیحی برای پروفایل خود ننوشته است.</p>
              )}
            </div>

            {isOwnProfile ? (
              <Link href="/dashboard/profile" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-black hover:bg-white/10">
                ویرایش پروفایل من
              </Link>
            ) : (
              <CommunityFollowButton username={profile.username} initialFollowing={following} />
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-200">
              <Clock3 className="h-4 w-4" />
              <span className="text-xs font-black">فعالیت عمومی</span>
            </div>
            <h2 className="mt-2 text-xl font-black">فهرست‌های عمومی</h2>
            <p className="mt-1 text-sm leading-7 text-slate-500">
              فقط عنوان‌هایی نمایش داده می‌شوند که صاحب پروفایل صریحاً عمومی کرده است.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
            {publicActivity.length} عنوان
          </span>
        </div>

        {publicActivity.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <p className="text-sm leading-7 text-slate-400">
              این عضو هنوز فعالیت عمومی قابل نمایش ندارد.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {publicActivity.map(({ item, title }) => {
              const label = title?.title || title?.name || `عنوان ${item.title_id}`;

              return (
                <Link
                  key={item.id}
                  href={`/title/${item.title_id}?type=${item.title_type}`}
                  className="group rounded-2xl border border-white/10 bg-white/[0.025] p-3 transition hover:border-blue-400/30 hover:bg-white/[0.05]"
                >
                  <div className="aspect-[2/3] overflow-hidden rounded-xl bg-slate-900">
                    {title?.poster_path ? (
                      <TmdbImage
                        src={`https://image.tmdb.org/t/p/w500${title.poster_path}`}
                        alt={label}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-xs text-slate-600">
                        تصویر در دسترس نیست
                      </div>
                    )}
                  </div>
                  <p className="mt-3 truncate text-sm font-black text-slate-100">{label}</p>
                  <p className="mt-1 text-xs font-bold text-blue-300">{STATUS_LABELS[item.status]}</p>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-amber-400/10 bg-amber-500/[0.04] px-4 py-3 text-xs leading-6 text-amber-100/70">
          امتیازها و دفترچه تماشا در این مرحله خصوصی می‌مانند و روی پروفایل دیگران نمایش داده نمی‌شوند.
        </div>
      </section>
    </main>
  );
}
