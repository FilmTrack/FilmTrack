import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CommunityReviewComposer from "@/components/CommunityReviewComposer";
import { isCommunityContentRuntimeEnabled } from "@/lib/m3/community-content-readiness";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ type?: string }>;

export default async function TitleCommunityPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { id } = await params;
  const { type = "movie" } = await searchParams;
  const titleId = Number(id);
  const titleType = type === "tv" ? "tv" : "movie";
  if (!Number.isFinite(titleId) || titleId <= 0) redirect("/movies");

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect(`/auth?next=${encodeURIComponent(`/title/${id}/community?type=${titleType}`)}`);

  if (!isCommunityContentRuntimeEnabled()) {
    return (
      <main className="min-h-screen bg-[#050914] px-4 py-12 text-white" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <h1 className="text-2xl font-black">نقد و گفت‌وگوی FilmTrack</h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">زیرساخت این بخش آماده شده اما تا تکمیل Gate دیتابیس Production عمداً غیرفعال است.</p>
          <Link href={`/title/${id}?type=${titleType}`} className="mt-5 inline-flex rounded-xl border border-white/10 px-4 py-2 text-sm font-bold">بازگشت به عنوان</Link>
        </div>
      </main>
    );
  }

  const { data: reviews } = await supabase
    .from("community_reviews")
    .select("id,user_id,body,contains_spoilers,visibility,created_at")
    .eq("title_id", titleId)
    .eq("title_type", titleType)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <main className="min-h-screen bg-[#050914] px-4 py-10 text-white" dir="rtl">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div><p className="text-xs font-black text-violet-300">Community Content v1</p><h1 className="mt-2 text-2xl font-black">نقدها و گفت‌وگو</h1></div>
          <Link href={`/title/${id}?type=${titleType}`} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold">صفحه عنوان</Link>
        </div>
        <CommunityReviewComposer titleId={titleId} titleType={titleType} />
        <section className="mt-7 space-y-3">
          <h2 className="text-lg font-black">نقدهای عمومی</h2>
          {(reviews || []).length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-500">هنوز نقد عمومی برای این عنوان ثبت نشده است.</div> : (reviews || []).map((review) => (
            <article key={review.id} className="rounded-2xl border border-white/10 bg-[#0b1220]/80 p-5">
              {review.contains_spoilers ? <p className="mb-3 text-xs font-black text-amber-300">هشدار اسپویل</p> : null}
              <p className="whitespace-pre-wrap text-sm leading-8 text-slate-200">{review.body}</p>
              <p className="mt-3 text-[11px] text-slate-600">{new Date(review.created_at).toLocaleDateString("fa-IR")}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
