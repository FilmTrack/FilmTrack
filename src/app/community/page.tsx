import Link from "next/link";
import { ArrowRight, LockKeyhole, Search, UserRound, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { isCommunityRuntimeEnabled } from "@/lib/m3/readiness";
import { createClient } from "@/lib/supabase/server";

type PublicCommunityMember = {
  username: string;
  display_name: string | null;
  bio: string | null;
};

type CommunityDiscoveryPageProps = {
  searchParams: Promise<{ q?: string }>;
};

function sanitizeDiscoveryQuery(value: string | undefined) {
  return (value ?? "")
    .replace(/[%_(),]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
}

export default async function CommunityDiscoveryPage({
  searchParams,
}: CommunityDiscoveryPageProps) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const viewerUserId = claimsData?.claims?.sub;

  if (!viewerUserId) redirect("/auth");

  const enabled = isCommunityRuntimeEnabled();
  if (!enabled) {
    return (
      <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
        <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 py-16 sm:px-6">
          <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <LockKeyhole className="h-8 w-8 text-violet-300" />
            <h1 className="mt-5 text-2xl font-black">کشف اعضا هنوز فعال نیست</h1>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              این مسیر پشت Feature Flag قرار دارد و تا زمان تأیید زیرساخت Community هیچ queryای به جدول‌های M3 انجام نمی‌دهد.
            </p>
            <Link href="/dashboard" className="mt-6 inline-flex items-center text-sm font-black text-blue-300 hover:text-blue-200">
              <ArrowRight className="ml-2 h-4 w-4" /> بازگشت به داشبورد
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const { q } = await searchParams;
  const query = sanitizeDiscoveryQuery(q);
  let members: PublicCommunityMember[] = [];

  if (query.length >= 2) {
    // Deliberately do not select user_id, email or auth metadata. Discovery only
    // projects fields that are explicitly part of the public Community profile.
    const [usernameResult, displayNameResult] = await Promise.all([
      supabase
        .from("community_profiles")
        .select("username,display_name,bio")
        .eq("visibility", "public")
        .ilike("username", `%${query}%`)
        .order("username", { ascending: true })
        .limit(12),
      supabase
        .from("community_profiles")
        .select("username,display_name,bio")
        .eq("visibility", "public")
        .ilike("display_name", `%${query}%`)
        .order("username", { ascending: true })
        .limit(12),
    ]);

    const merged = [
      ...((usernameResult.data ?? []) as unknown as PublicCommunityMember[]),
      ...((displayNameResult.data ?? []) as unknown as PublicCommunityMember[]),
    ];

    members = Array.from(
      new Map(merged.map((member) => [member.username, member])).values(),
    ).slice(0, 20);
  }

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_80%_0%,rgba(37,99,235,.16),transparent_32%),radial-gradient(circle_at_20%_5%,rgba(124,58,237,.14),transparent_28%)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <Link href="/dashboard/community" className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white">
            <ArrowRight className="ml-2 h-4 w-4" /> شبکه من
          </Link>

          <div className="mt-5 flex items-start gap-4">
            <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
              <Users className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-3xl font-black sm:text-4xl">کشف اعضای FilmTrack</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                اعضایی را پیدا کن که پروفایل اجتماعی خود را صریحاً عمومی کرده‌اند. ایمیل و شناسه داخلی حساب هرگز در این سطح نمایش داده نمی‌شود.
              </p>
            </div>
          </div>

          <form action="/community" method="get" className="mt-7 flex max-w-2xl gap-2">
            <label htmlFor="community-search" className="sr-only">جست‌وجوی اعضا</label>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="community-search"
                name="q"
                defaultValue={query}
                minLength={2}
                maxLength={48}
                autoComplete="off"
                placeholder="نام کاربری یا نام نمایشی…"
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/25 pr-11 pl-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/40"
              />
            </div>
            <button type="submit" className="min-h-12 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-500">
              جست‌وجو
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {query.length < 2 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <Search className="h-6 w-6 text-blue-300" />
            <p className="mt-3 text-sm leading-7 text-slate-400">
              برای شروع، حداقل دو نویسه از username یا نام نمایشی عضو را وارد کن.
            </p>
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <p className="text-sm leading-7 text-slate-400">پروفایل عمومی منطبق با «{query}» پیدا نشد.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {members.map((member) => (
              <Link
                key={member.username}
                href={`/u/${encodeURIComponent(member.username)}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-blue-400/30 hover:bg-white/[0.05]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
                    <UserRound className="h-5 w-5 text-blue-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-white">
                      {member.display_name || `@${member.username}`}
                    </p>
                    <p className="mt-1 truncate text-xs font-bold text-blue-300" dir="ltr">@{member.username}</p>
                    {member.bio ? (
                      <p className="mt-3 line-clamp-2 text-xs leading-6 text-slate-500">{member.bio}</p>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
