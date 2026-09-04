import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole, MessageSquareText, ShieldAlert, Star } from "lucide-react";

import EpisodeCommunityComposer from "@/components/EpisodeCommunityComposer";
import EpisodeReviewCommentForm from "@/components/EpisodeReviewCommentForm";
import { isEpisodeCommunityRuntimeEnabled } from "@/lib/m3/episode-community-readiness";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "گفت‌وگوی اپیزود | FilmTrack",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string; season: string; episode: string }>;
};

type EpisodeReviewRow = {
  id: string;
  user_id: string;
  rating: number | null;
  body: string | null;
  contains_spoilers: boolean;
  visibility: "private" | "public";
  created_at: string;
};

type CommentRow = {
  id: string;
  review_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export default async function EpisodeCommunityPage({ params }: PageProps) {
  const { id, season, episode } = await params;
  const titleId = Number(id);
  const seasonNumber = Number(season);
  const episodeNumber = Number(episode);

  if (!Number.isInteger(titleId) || titleId <= 0 || !Number.isInteger(seasonNumber) || seasonNumber < 0 || !Number.isInteger(episodeNumber) || episodeNumber <= 0) {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth");

  const { data: watchedRow } = await supabase
    .from("episode_progress")
    .select("id")
    .eq("user_id", userId)
    .eq("title_id", titleId)
    .eq("season_number", seasonNumber)
    .eq("episode_number", episodeNumber)
    .maybeSingle();

  const isWatched = Boolean(watchedRow);

  if (!isEpisodeCommunityRuntimeEnabled()) {
    return (
      <main className="min-h-screen bg-[#050914] px-4 pb-16 pt-24 text-white" dir="rtl">
        <div className="mx-auto max-w-4xl">
          <Link href={`/title/${titleId}/episodes?season=${seasonNumber}`} className="text-sm font-bold text-blue-300">بازگشت به قسمت‌ها</Link>
          <section className="mt-6 rounded-3xl border border-violet-400/15 bg-violet-500/[0.06] p-6">
            <h1 className="text-2xl font-black">کامیونیتی اپیزود</h1>
            <p className="mt-3 leading-8 text-slate-400">زیرساخت امتیاز، نقد و گفت‌وگوی اپیزود آماده است اما تا Gate انتشار نهایی فعال نمی‌شود.</p>
          </section>
        </div>
      </main>
    );
  }

  // Spoiler boundary: never read episode-community content before the current user
  // has explicitly marked this exact episode watched.
  if (!isWatched) {
    return (
      <main className="min-h-screen bg-[#050914] px-4 pb-16 pt-24 text-white" dir="rtl">
        <div className="mx-auto max-w-4xl">
          <Link href={`/title/${titleId}/episodes?season=${seasonNumber}`} className="text-sm font-bold text-blue-300">بازگشت به قسمت‌ها</Link>
          <section className="mt-6 rounded-3xl border border-amber-400/20 bg-amber-500/10 p-6">
            <div className="flex items-center gap-2 text-amber-200"><LockKeyhole className="h-5 w-5" /><h1 className="text-2xl font-black">محافظ اسپویل فعال است</h1></div>
            <p className="mt-3 leading-8 text-amber-100/75">تا وقتی فصل {seasonNumber} قسمت {episodeNumber} را دیده‌شده علامت نزنی، هیچ نقد، امتیاز یا گفت‌وگویی از این اپیزود خوانده نمی‌شود.</p>
          </section>
        </div>
      </main>
    );
  }

  const { data: reviewRows } = await supabase
    .from("community_episode_reviews")
    .select("id,user_id,rating,body,contains_spoilers,visibility,created_at")
    .eq("title_id", titleId)
    .eq("season_number", seasonNumber)
    .eq("episode_number", episodeNumber)
    .order("created_at", { ascending: false });

  const reviews = (reviewRows ?? []) as EpisodeReviewRow[];
  const reviewIds = reviews.map((review) => review.id);
  let comments: CommentRow[] = [];

  if (reviewIds.length > 0) {
    const { data: commentRows } = await supabase
      .from("community_episode_review_comments")
      .select("id,review_id,user_id,body,created_at")
      .in("review_id", reviewIds)
      .order("created_at", { ascending: true });
    comments = (commentRows ?? []) as CommentRow[];
  }

  return (
    <main className="min-h-screen bg-[#050914] px-4 pb-16 pt-24 text-white" dir="rtl">
      <div className="mx-auto max-w-4xl">
        <Link href={`/title/${titleId}/episodes?season=${seasonNumber}`} className="text-sm font-bold text-blue-300">بازگشت به قسمت‌ها</Link>

        <header className="mt-6 rounded-3xl border border-white/10 bg-[#0b1220] p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-300">فصل {seasonNumber} · قسمت {episodeNumber}</span>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">دیده‌شده</span>
          </div>
          <h1 className="mt-4 text-3xl font-black">امتیاز و گفت‌وگوی اپیزود</h1>
          <p className="mt-3 flex items-center gap-2 text-sm leading-7 text-slate-400"><ShieldAlert className="h-4 w-4 text-amber-300" /> این صفحه فقط بعد از ثبت تماشای همین قسمت باز می‌شود تا اسپویل ناخواسته رخ ندهد.</p>
        </header>

        <div className="mt-6">
          <EpisodeCommunityComposer titleId={titleId} seasonNumber={seasonNumber} episodeNumber={episodeNumber} initiallyWatched />
        </div>

        <section className="mt-8">
          <div className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-violet-300" /><h2 className="text-xl font-black">نظرهای قابل مشاهده</h2></div>
          {reviews.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-slate-400">هنوز نظر قابل مشاهده‌ای برای این قسمت نیست. اولین نفر باش.</div>
          ) : (
            <div className="mt-4 grid gap-4">
              {reviews.map((review) => {
                const reviewComments = comments.filter((comment) => comment.review_id === review.id);
                return (
                  <article key={review.id} className="rounded-2xl border border-white/10 bg-[#0b1220]/85 p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-black text-slate-200">{review.user_id === userId ? "نظر من" : "کاربر FilmTrack"}</span>
                      {review.rating != null ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 font-black text-amber-300"><Star className="h-3.5 w-3.5" /> {review.rating}/10</span> : null}
                      {review.contains_spoilers ? <span className="rounded-full bg-rose-500/10 px-2.5 py-1 font-black text-rose-300">دارای اسپویل</span> : null}
                    </div>
                    {review.body ? <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-slate-200">{review.body}</p> : null}
                    {reviewComments.length > 0 ? (
                      <div className="mt-4 grid gap-2 border-t border-white/10 pt-4">
                        {reviewComments.map((comment) => <p key={comment.id} className="rounded-xl bg-white/[0.03] px-3 py-2 text-xs leading-6 text-slate-300">{comment.body}</p>)}
                      </div>
                    ) : null}
                    <EpisodeReviewCommentForm reviewId={review.id} />
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
