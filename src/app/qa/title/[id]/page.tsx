import Link from "next/link";
import { ChevronLeft, Clock3, Sparkles, Star, Users } from "lucide-react";
import { notFound } from "next/navigation";

import { getDemoTitleDetails, isLocalVisualQa } from "@/lib/demo-catalog";
import type { TmdbMediaType } from "@/lib/tmdb";

type QaTitlePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
};

export default async function QaTitlePage({ params, searchParams }: QaTitlePageProps) {
  if (!isLocalVisualQa) return notFound();

  const { id } = await params;
  const { type: rawType } = await searchParams;
  const type: TmdbMediaType = rawType === "tv" ? "tv" : "movie";
  const data = getDemoTitleDetails(Number(id), type);

  if (!data) return notFound();

  const title = data.title || data.name || "FilmTrack";
  const year = data.release_date
    ? new Date(data.release_date).getFullYear()
    : data.first_air_date
      ? new Date(data.first_air_date).getFullYear()
      : "—";
  const runtime = data.runtime || data.episode_run_time?.[0] || 0;
  const cast = data.credits?.cast ?? [];

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={type === "tv" ? "/shows" : "/movies"}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-bold text-slate-300 transition hover:border-blue-400/30 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" /> بازگشت
        </Link>

        <section className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
          <div className="mx-auto w-full max-w-[320px] lg:mx-0">
            <div className="flex aspect-[2/3] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_70%_18%,rgba(59,130,246,.36),transparent_30%),linear-gradient(145deg,#111c35,#080d19_65%,#201044)] p-6 shadow-2xl shadow-black/30">
              <span className="text-xs font-black text-blue-200">FILMTRACK LOCAL QA</span>
              <div>
                <p className="text-sm text-slate-400">{type === "tv" ? "سریال" : "فیلم"}</p>
                <h1 className="mt-2 text-3xl font-black leading-tight">{title}</h1>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-[#0b1220]/90 p-6 shadow-xl sm:p-8">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-blue-200">
                  {type === "tv" ? "سریال" : "فیلم"}
                </span>
                <span>{year}</span>
                {runtime > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" /> {runtime} دقیقه
                  </span>
                )}
              </div>

              <h2 className="mt-5 text-3xl font-black sm:text-4xl lg:text-5xl">{title}</h2>

              <div className="mt-5 flex flex-wrap gap-2">
                {data.genres?.map((genre) => (
                  <span key={genre.id} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-300">
                    {genre.name}
                  </span>
                ))}
              </div>

              <p className="mt-6 text-sm leading-8 text-slate-300 sm:text-base">{data.overview}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <button className="min-h-12 rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 px-4 text-sm font-black">افزودن به فهرست</button>
                <button className="min-h-12 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold">ثبت تماشا</button>
                <button className="min-h-12 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold">امتیاز دادن</button>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
              <div className="flex items-center gap-2 text-sm font-black">
                <Users className="h-4 w-4 text-blue-300" /> بازیگران
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {cast.map((person) => (
                  <article key={person.id} className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                    <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30" />
                    <p className="mt-3 text-center text-sm font-black">{person.name}</p>
                    <p className="mt-1 text-center text-xs text-slate-500">{person.character}</p>
                  </article>
                ))}
              </div>
            </section>

            {type === "tv" && data.seasons && (
              <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
                <h3 className="text-sm font-black">فصل‌ها</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {data.seasons.map((season) => (
                    <article key={season.id} className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                      <p className="font-black">{season.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{season.episode_count} قسمت</p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-[#0b1220]/90 p-5">
              <div className="flex items-center gap-2 text-sm font-black">
                <Sparkles className="h-4 w-4 text-violet-300" /> امتیاز FilmTrack
              </div>
              <p className="mt-4 flex items-center gap-2 text-3xl font-black">
                <Star className="h-6 w-6 fill-amber-400 text-amber-400" /> {data.vote_average?.toFixed(1)}
                <span className="text-sm text-slate-500">/10</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">{data.vote_count?.toLocaleString("fa-IR")} رأی نمایشی</p>
            </div>

            <div className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-5 text-sm leading-7 text-violet-100">
              این صفحه فقط در محیط توسعه برای QA بصری فعال است و هیچ داده نمایشی وارد Production نمی‌شود.
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
