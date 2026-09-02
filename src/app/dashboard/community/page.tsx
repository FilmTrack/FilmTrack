import Link from "next/link";
import { ArrowRight, LockKeyhole, UserRound, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { isCommunityRuntimeEnabled } from "@/lib/m3/readiness";
import { createClient } from "@/lib/supabase/server";

type FollowEdge = {
  follower_user_id: string;
  followed_user_id: string;
  created_at: string;
};

type PublicProfile = {
  user_id: string;
  username: string;
  display_name: string | null;
};

type NetworkMember = {
  profile: PublicProfile | null;
  createdAt: string;
};

function MemberList({
  title,
  members,
  emptyMessage,
}: {
  title: string;
  members: NetworkMember[];
  emptyMessage: string;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-black">{title}</h2>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-slate-300">
          {members.length}
        </span>
      </div>

      {members.length === 0 ? (
        <p className="mt-5 text-sm leading-7 text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="mt-5 grid gap-3">
          {members.map((member, index) => {
            const profile = member.profile;
            const card = (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-blue-400/25">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
                  <UserRound className="h-5 w-5 text-blue-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-white">
                    {profile?.display_name || (profile ? `@${profile.username}` : "عضو با پروفایل خصوصی")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500" dir={profile ? "ltr" : "rtl"}>
                    {profile ? `@${profile.username}` : "هویت عمومی این عضو قابل نمایش نیست"}
                  </p>
                </div>
              </div>
            );

            return profile ? (
              <Link key={`${profile.username}-${member.createdAt}`} href={`/u/${encodeURIComponent(profile.username)}`}>
                {card}
              </Link>
            ) : (
              <div key={`private-${member.createdAt}-${index}`}>{card}</div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default async function CommunityNetworkPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect("/auth");

  const enabled = isCommunityRuntimeEnabled();
  if (!enabled) {
    return (
      <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
        <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-16 sm:px-6">
          <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <LockKeyhole className="h-8 w-8 text-violet-300" />
            <h1 className="mt-5 text-2xl font-black">شبکه اجتماعی هنوز فعال نیست</h1>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              این صفحه پشت Feature Flag قرار دارد و تا زمان تأیید زیرساخت Community هیچ queryای به جدول‌های M3 انجام نمی‌دهد.
            </p>
            <Link href="/dashboard" className="mt-6 inline-flex items-center text-sm font-black text-blue-300 hover:text-blue-200">
              <ArrowRight className="ml-2 h-4 w-4" /> بازگشت به داشبورد
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // RLS only returns edges where the signed-in user participates. This page
  // therefore cannot enumerate another member's graph.
  const { data: edgeData } = await supabase
    .from("community_follows")
    .select("follower_user_id,followed_user_id,created_at")
    .or(`follower_user_id.eq.${userId},followed_user_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(100);

  const edges = (edgeData ?? []) as unknown as FollowEdge[];
  const incoming = edges.filter((edge) => edge.followed_user_id === userId);
  const outgoing = edges.filter((edge) => edge.follower_user_id === userId);
  const counterpartIds = Array.from(
    new Set([
      ...incoming.map((edge) => edge.follower_user_id),
      ...outgoing.map((edge) => edge.followed_user_id),
    ]),
  );

  let profileRows: PublicProfile[] = [];
  if (counterpartIds.length > 0) {
    const { data } = await supabase
      .from("community_profiles")
      .select("user_id,username,display_name")
      .in("user_id", counterpartIds)
      .eq("visibility", "public");

    profileRows = (data ?? []) as unknown as PublicProfile[];
  }

  const profileByUserId = new Map(profileRows.map((profile) => [profile.user_id, profile]));
  const followers: NetworkMember[] = incoming.map((edge) => ({
    profile: profileByUserId.get(edge.follower_user_id) ?? null,
    createdAt: edge.created_at,
  }));
  const following: NetworkMember[] = outgoing.map((edge) => ({
    profile: profileByUserId.get(edge.followed_user_id) ?? null,
    createdAt: edge.created_at,
  }));

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_80%_0%,rgba(37,99,235,.16),transparent_32%),radial-gradient(circle_at_20%_5%,rgba(124,58,237,.14),transparent_28%)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <Link href="/dashboard" className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white">
            <ArrowRight className="ml-2 h-4 w-4" /> بازگشت به داشبورد
          </Link>
          <div className="mt-5 flex items-start gap-4">
            <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
              <Users className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-3xl font-black sm:text-4xl">شبکه من</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                دنبال‌کننده‌ها و حساب‌هایی که دنبال می‌کنی فقط در فضای شخصی خودت نمایش داده می‌شوند. اعضای دارای پروفایل عمومی قابل بازکردن هستند.
              </p>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-2xl font-black">{followers.length}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">دنبال‌کننده</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-2xl font-black">{following.length}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">دنبال‌شده</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <MemberList title="دنبال‌کننده‌ها" members={followers} emptyMessage="هنوز کسی شما را دنبال نکرده است." />
        <MemberList title="دنبال می‌کنید" members={following} emptyMessage="هنوز عضوی را دنبال نکرده‌اید." />
      </div>
    </main>
  );
}
