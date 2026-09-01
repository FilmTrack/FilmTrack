import Link from "next/link";
import { ArrowRight, ShieldCheck, UserRound } from "lucide-react";
import { redirect } from "next/navigation";

import CommunityProfileEditor from "@/components/CommunityProfileEditor";
import { isCommunityRuntimeEnabled } from "@/lib/m3/readiness";
import { createClient } from "@/lib/supabase/server";

type CommunityProfileRow = {
  username: string;
  display_name: string | null;
  bio: string | null;
  visibility: "private" | "public";
};

export default async function CommunityProfilePage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect("/auth");

  const enabled = isCommunityRuntimeEnabled();
  let profile: CommunityProfileRow | null = null;

  // Never access M3 tables while the runtime gate is disabled. This keeps the
  // page safe before the repository-only migration is explicitly approved.
  if (enabled) {
    const { data } = await supabase
      .from("community_profiles")
      .select("username, display_name, bio, visibility")
      .eq("user_id", userId)
      .maybeSingle();

    profile = data as unknown as CommunityProfileRow | null;
  }

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_80%_0%,rgba(37,99,235,.16),transparent_32%),radial-gradient(circle_at_20%_5%,rgba(124,58,237,.14),transparent_28%)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <Link
            href="/dashboard"
            className="mb-5 inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <ArrowRight className="ml-2 h-4 w-4" />
            بازگشت به داشبورد
          </Link>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-200">
                <UserRound className="h-4 w-4" /> هویت طرفداری FilmTrack
              </div>
              <h1 className="mt-4 text-3xl font-black sm:text-4xl">پروفایل من</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                نام کاربری، نام نمایشی و حریم خصوصی هویت اجتماعی خودت را مدیریت کن. ایمیل حساب هرگز بخشی از پروفایل عمومی نیست.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/15 bg-emerald-500/5 px-4 py-3 text-xs font-bold text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              حریم خصوصی پیش‌فرض: خصوصی
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <CommunityProfileEditor
          initialUsername={profile?.username ?? ""}
          initialDisplayName={profile?.display_name ?? ""}
          initialBio={profile?.bio ?? ""}
          initialVisibility={profile?.visibility ?? "private"}
        />
      </section>
    </main>
  );
}
