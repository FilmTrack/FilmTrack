import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CommunityListComposer from "@/components/CommunityListComposer";
import { isCommunityContentRuntimeEnabled } from "@/lib/m3/community-content-readiness";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "محتوای اجتماعی من | FilmTrack", robots: { index: false, follow: false } };

export default async function CommunityContentDashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth");

  if (!isCommunityContentRuntimeEnabled()) {
    return (
      <main className="min-h-screen bg-[#050914] px-4 py-12 text-white" dir="rtl">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <p className="text-xs font-black text-violet-300">Community Content v1</p>
          <h1 className="mt-3 text-3xl font-black">نقدها، فهرست‌ها و فعالیت من</h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-400">کد و schema این بخش آماده است، اما تا اجرای جداگانه و تأییدشده migration روی Production، runtime عمداً خاموش می‌ماند.</p>
          <Link href="/dashboard" className="mt-6 inline-flex rounded-xl border border-white/10 px-4 py-2 text-sm font-bold">بازگشت به داشبورد</Link>
        </div>
      </main>
    );
  }

  const [{ data: reviews }, { data: lists }, { data: activity }] = await Promise.all([
    supabase.from("community_reviews").select("id,title_id,title_type,body,visibility,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("community_lists").select("id,slug,name,description,visibility,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("community_activity_events").select("id,event_type,title_id,title_type,visibility,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
  ]);

  return (
    <main className="min-h-screen bg-[#050914] px-4 py-10 text-white" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-black text-violet-300">فضای محتوای شخصی</p><h1 className="mt-2 text-3xl font-black">نقدها، فهرست‌ها و فعالیت من</h1></div>
          <Link href="/community/feed" className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-black text-violet-100">فید جامعه</Link>
        </div>

        <div className="mt-7"><CommunityListComposer /></div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-black">نقدهای من</h2>
            <div className="mt-4 space-y-3">{(reviews || []).length ? (reviews || []).map((r) => <Link key={r.id} href={`/title/${r.title_id}/community?type=${r.title_type}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4"><p className="line-clamp-3 text-sm leading-7 text-slate-300">{r.body}</p><p className="mt-2 text-[11px] text-slate-600">{r.visibility === "public" ? "عمومی" : "خصوصی"}</p></Link>) : <p className="text-sm text-slate-500">هنوز نقدی ثبت نکرده‌ای.</p>}</div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-black">فهرست‌های من</h2>
            <div className="mt-4 space-y-3">{(lists || []).length ? (lists || []).map((l) => <div key={l.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="font-black">{l.name}</p><p className="mt-1 text-xs text-slate-500">/{l.slug} · {l.visibility === "public" ? "عمومی" : "خصوصی"}</p>{l.description ? <p className="mt-2 text-xs leading-6 text-slate-400">{l.description}</p> : null}</div>) : <p className="text-sm text-slate-500">هنوز فهرست سفارشی نساخته‌ای.</p>}</div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-black">فعالیت اخیر</h2>
            <div className="mt-4 space-y-3">{(activity || []).length ? (activity || []).map((a) => <div key={a.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-sm font-bold">{a.event_type}</p><p className="mt-1 text-[11px] text-slate-600">{new Date(a.created_at).toLocaleString("fa-IR")}</p></div>) : <p className="text-sm text-slate-500">هنوز فعالیت محتوایی ثبت نشده است.</p>}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
