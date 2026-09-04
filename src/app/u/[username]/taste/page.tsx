import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Film, Sparkles, UsersRound } from "lucide-react";

import TmdbImage from "@/components/TmdbImage";
import { isCommunityRuntimeEnabled } from "@/lib/m3/readiness";
import { computeTasteMatch, type MatchSignal, type MatchStatus } from "@/lib/m4/taste-match";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Taste Match | FilmTrack",
  robots: { index: false, follow: false },
};

type ProfileRow = { user_id: string; username: string; display_name: string | null };
type ListRow = { title_id: number; title_type: "movie" | "tv"; status: MatchStatus };
type TmdbTitle = { id: number; title?: string; name?: string; poster_path?: string | null };

async function fetchTmdb(item: MatchSignal, apiKey?: string): Promise<TmdbTitle | null> {
  if (!apiKey) return null;
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/${item.titleType}/${item.titleId}?api_key=${apiKey}&language=fa-IR`,
      { next: { revalidate: 3600 } },
    );
    return response.ok ? ((await response.json()) as TmdbTitle) : null;
  } catch {
    return null;
  }
}

export default async function TasteMatchPage({ params }: { params: Promise<{ username: string }> }) {
  if (!isCommunityRuntimeEnabled()) redirect("/community");

  const { username: rawUsername } = await params;
  const username = rawUsername.trim().toLowerCase();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const viewerUserId = claimsData?.claims?.sub;
  if (!viewerUserId) redirect("/auth");

  const { data: profileData } = await supabase
    .from("community_profiles")
    .select("user_id,username,display_name")
    .eq("username", username)
    .eq("visibility", "public")
    .maybeSingle();

  if (!profileData) notFound();
  const profile = profileData as unknown as ProfileRow;
  if (profile.user_id === viewerUserId) redirect("/dashboard/stats");

  const [{ data: viewerData }, { data: otherData }] = await Promise.all([
    supabase
      .from("user_lists")
      .select("title_id,title_type,status")
      .eq("user_id", viewerUserId),
    supabase
      .from("user_lists")
      .select("title_id,title_type,status")
      .eq("user_id", profile.user_id)
      .eq("is_public", true),
  ]);

  // Privacy contract: viewer signals are first-party; the other member contributes
  // only rows they explicitly marked public. Ratings/diary are never queried cross-user.
  const viewerSignals = ((viewerData || []) as unknown as ListRow[]).map((row) => ({
    titleId: row.title_id,
    titleType: row.title_type,
    status: row.status,
  }));
  const otherSignals = ((otherData || []) as unknown as ListRow[]).map((row) => ({
    titleId: row.title_id,
    titleType: row.title_type,
    status: row.status,
  }));

  const match = computeTasteMatch(viewerSignals, otherSignals);
  const recommendationDetails = await Promise.all(
    match.recommendations.map((item) => fetchTmdb(item, process.env.TMDB_API_KEY)),
  );
  const displayName = profile.display_name || `@${profile.username}`;

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_80%_0%,rgba(124,58,237,.18),transparent_32%),radial-gradient(circle_at_18%_5%,rgba(37,99,235,.12),transparent_28%)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href={`/u/${encodeURIComponent(profile.username)}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-400 hover:text-white">
            <ArrowRight className="h-4 w-4" /> بازگشت به پروفایل
          </Link>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-black text-violet-200">
            <UsersRound className="h-4 w-4" /> Taste Match v1
          </div>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">سلیقه تو و {displayName} چقدر شبیه است؟</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            این مقایسه فقط از فهرست‌هایی استفاده می‌کند که {displayName} عمداً عمومی کرده است. امتیازها و دفترچه خصوصی او وارد محاسبه نمی‌شوند.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {match.matchPercent == null ? (
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-9">
            <Film className="h-8 w-8 text-blue-300" />
            <h2 className="mt-4 text-xl font-black">برای درصد قابل‌اعتماد هنوز داده مشترک کافی نداریم</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              حداقل ۳ عنوان مشترک لازم است. فعلاً {match.sharedTitles} عنوان مشترک پیدا شد. با ثبت و عمومی‌کردن آگاهانه عنوان‌های بیشتر، Taste Match دقیق‌تر می‌شود.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-3xl border border-violet-400/20 bg-[linear-gradient(135deg,rgba(124,58,237,.16),rgba(37,99,235,.09))] p-7 sm:p-9">
              <Sparkles className="h-7 w-7 text-violet-200" />
              <p className="mt-5 text-6xl font-black tracking-tight text-white">٪{match.matchPercent.toLocaleString("fa-IR")}</p>
              <h2 className="mt-3 text-xl font-black">شباهت سلیقه</h2>
              <p className="mt-2 text-sm leading-7 text-slate-400">اعتماد محاسبه: {match.confidence} · بر اساس {match.sharedTitles.toLocaleString("fa-IR")} عنوان مشترک</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-2xl font-black">٪{match.statusAgreementPercent.toLocaleString("fa-IR")}</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">هم‌جهتی وضعیت تماشا</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-2xl font-black">٪{match.overlapCoveragePercent.toLocaleString("fa-IR")}</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">پوشش سلیقه مشترک</p>
              </div>
            </div>
          </section>
        )}

        <section className="mt-10">
          <div>
            <h2 className="text-2xl font-black">او دیده، تو هنوز ندیده‌ای</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">عنوان‌های عمومیِ تماشا‌شده یا درحال‌تماشای این عضو که هنوز در فهرست تو نیستند.</p>
          </div>

          {match.recommendations.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-sm text-slate-400">فعلاً پیشنهاد تازه‌ای از این هم‌سلیقه پیدا نشد.</div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {match.recommendations.map((item, index) => {
                const detail = recommendationDetails[index];
                const label = detail?.title || detail?.name || `عنوان #${item.titleId}`;
                return (
                  <Link key={`${item.titleType}:${item.titleId}`} href={`/title/${item.titleId}?type=${item.titleType}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/80 transition hover:border-violet-400/30">
                    <div className="aspect-[2/3] bg-white/[0.04]">
                      {detail?.poster_path ? <TmdbImage src={`https://image.tmdb.org/t/p/w500${detail.poster_path}`} alt={`پوستر ${label}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : null}
                    </div>
                    <div className="p-3">
                      <h3 className="line-clamp-2 text-sm font-black">{label}</h3>
                      <p className="mt-2 text-[11px] font-bold text-violet-200">{item.status === "completed" ? "او تماشا کرده" : "او در حال تماشا است"}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
