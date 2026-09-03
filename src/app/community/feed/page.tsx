import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isCommunityContentRuntimeEnabled } from "@/lib/m3/community-content-readiness";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "فید جامعه FilmTrack", robots: { index: false, follow: false } };

export default async function CommunityFeedPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/auth");

  if (!isCommunityContentRuntimeEnabled()) {
    return <main className="min-h-screen bg-[#050914] px-4 py-12 text-white" dir="rtl"><div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-8"><h1 className="text-3xl font-black">فید جامعه FilmTrack</h1><p className="mt-4 text-sm leading-8 text-slate-400">این بخش تا فعال‌سازی جداگانه Community Content روی دیتابیس Production عمداً خاموش است.</p></div></main>;
  }

  const { data: events } = await supabase
    .from("community_activity_events")
    .select("id,user_id,event_type,entity_id,title_id,title_type,created_at")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen bg-[#050914] px-4 py-10 text-white" dir="rtl">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black text-violet-300">FilmTrack Community</p><h1 className="mt-2 text-3xl font-black">فعالیت جامعه</h1></div><Link href="/community" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold">اعضا</Link></div>
        <div className="mt-7 space-y-3">{(events || []).length ? (events || []).map((event) => <article key={event.id} className="rounded-2xl border border-white/10 bg-[#0b1220]/80 p-5"><p className="text-sm font-black">{event.event_type === "review_created" ? "نقد جدید" : event.event_type === "review_liked" ? "پسندیدن نقد" : event.event_type === "review_commented" ? "نظر روی نقد" : event.event_type === "list_created" ? "فهرست جدید" : "به‌روزرسانی فهرست"}</p>{event.title_id ? <Link href={`/title/${event.title_id}${event.title_type ? `?type=${event.title_type}` : ""}`} className="mt-2 inline-flex text-xs font-bold text-violet-300">مشاهده عنوان</Link> : null}<p className="mt-2 text-[11px] text-slate-600">{new Date(event.created_at).toLocaleString("fa-IR")}</p></article>) : <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-slate-500">هنوز فعالیت عمومی کافی وجود ندارد.</div>}</div>
      </div>
    </main>
  );
}
