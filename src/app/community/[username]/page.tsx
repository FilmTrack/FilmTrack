import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";

import CommunityFollowButton from "@/components/CommunityFollowButton";
import { isCommunityRuntimeEnabled } from "@/lib/m3/readiness";
import { createClient } from "@/lib/supabase/server";

type CommunityProfileRow = {
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  visibility: "private" | "public";
};

export default async function CommunityPublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: rawUsername } = await params;
  const username = rawUsername.trim().toLowerCase();

  if (!isCommunityRuntimeEnabled()) {
    return (
      <main className="min-h-screen bg-[#050914] px-4 py-16 text-white" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[#0b1220]/90 p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-blue-300" />
          <h1 className="mt-4 text-2xl font-black">پروفایل اجتماعی هنوز فعال نشده است</h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            زیرساخت Community آماده است اما تا تأیید پایگاه‌داده و فعال‌شدن Runtime Gate هیچ داده اجتماعی خوانده یا نوشته نمی‌شود.
          </p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-300">
            <ArrowRight className="h-4 w-4" /> بازگشت به FilmTrack
          </Link>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const viewerId = claimsData?.claims?.sub;

  if (!viewerId) redirect("/auth");

  const { data, error } = await supabase
    .from("community_profiles")
    .select("user_id,username,display_name,bio,avatar_url,visibility")
    .eq("username", username)
    .eq("visibility", "public")
    .maybeSingle();

  if (error || !data) notFound();
  const profile = data as CommunityProfileRow;
  const isOwnProfile = profile.user_id === viewerId;

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_75%_0%,rgba(37,99,235,.16),transparent_34%),radial-gradient(circle_at_20%_10%,rgba(124,58,237,.14),transparent_30%)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white">
            <ArrowRight className="h-4 w-4" /> بازگشت به داشبورد
          </Link>

          <div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-blue-200">
                <UserRound className="h-9 w-9" />
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-500/5 px-3 py-1 text-xs font-bold text-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" /> پروفایل عمومی تأییدشده توسط کاربر
                </div>
                <h1 className="mt-3 truncate text-3xl font-black sm:text-4xl">
                  {profile.display_name || profile.username}
                </h1>
                <p dir="ltr" className="mt-1 text-left text-sm font-bold text-blue-300">@{profile.username}</p>
                {profile.bio ? (
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{profile.bio}</p>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">این عضو هنوز توضیحی درباره خودش ننوشته است.</p>
                )}
              </div>
            </div>

            {isOwnProfile ? (
              <Link href="/dashboard/profile" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-black text-white transition hover:bg-white/10">
                ویرایش پروفایل من
              </Link>
            ) : (
              <CommunityFollowButton username={profile.username} initialFollowing={false} />
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220]/80 p-6">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
            <div>
              <h2 className="font-black">حریم خصوصی در اولویت است</h2>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                فقط اطلاعاتی که صاحب حساب صریحاً در پروفایل Community عمومی کرده نمایش داده می‌شود. ایمیل، شناسه ورود و داده‌های خصوصی حساب در این صفحه نمایش داده نمی‌شوند.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
