import Link from "next/link";
import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { notFound } from "next/navigation";

import CommunityFollowButton from "@/components/CommunityFollowButton";
import { isCommunityRuntimeEnabled } from "@/lib/m3/readiness";
import { createClient } from "@/lib/supabase/server";

type CommunityProfileRow = {
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
};

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
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <h2 className="text-lg font-black">فعالیت اجتماعی</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
            هویت عمومی و رابطه دنبال‌کردن اکنون فعال است. نمایش فعالیت، نقدها و دفترچه تماشا در مرحله بعد با کنترل حریم خصوصی به این صفحه اضافه می‌شود.
          </p>
        </div>
      </section>
    </main>
  );
}
