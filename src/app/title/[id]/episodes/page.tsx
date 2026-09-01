import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ListChecks, PlayCircle } from "lucide-react";

import EpisodeProgressButton from "@/components/EpisodeProgressButton";
import { createClient } from "@/lib/supabase/server";
import { fetchJson, type TmdbTitleDetails } from "@/lib/tmdb";

type Episode = {
  id: number;
  name: string;
  overview?: string;
  episode_number: number;
  season_number: number;
  air_date?: string | null;
  runtime?: number | null;
  still_path?: string | null;
};

type SeasonDetails = {
  id: number;
  name: string;
  season_number: number;
  episodes?: Episode[];
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string }>;
};

export default async function EpisodeTrackingPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { season: rawSeason } = await searchParams;
  const titleId = Number(id);
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey || !Number.isInteger(titleId) || titleId <= 0) return notFound();

  const show = await fetchJson<TmdbTitleDetails>(
    `https://api.themoviedb.org/3/tv/${titleId}?api_key=${apiKey}&language=fa-IR`,
  );
  if (!show) return notFound();

  const seasons = (show.seasons || []).filter((season) => season.season_number > 0 && season.episode_count > 0);
  const requestedSeason = Number(rawSeason);
  const selectedSeason = seasons.some((season) => season.season_number === requestedSeason)
    ? requestedSeason
    : seasons[0]?.season_number;

  if (!selectedSeason) return notFound();

  const season = await fetchJson<SeasonDetails>(
    `https://api.themoviedb.org/3/tv/${titleId}/season/${selectedSeason}?api_key=${apiKey}&language=fa-IR`,
  );
  if (!season) return notFound();

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  let watched = new Set<number>();
  if (userId) {
    const { data } = await supabase
      .from("episode_progress")
      .select("episode_number")
      .eq("user_id", userId)
      .eq("title_id", titleId)
      .eq("season_number", selectedSeason);

    watched = new Set((data || []).map((entry) => entry.episode_number));
  }

  const title = show.name || "سریال";
  const episodes = season.episodes || [];
  const completed = episodes.filter((episode) => watched.has(episode.episode_number)).length;
  const progressPercent = episodes.length === 0 ? 0 : Math.round((completed / episodes.length) * 100);

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <Link
          href={`/title/${titleId}?type=tv`}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-bold text-slate-300 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" /> بازگشت به {title}
        </Link>

        <header className="mt-6 rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_80%_0%,rgba(59,130,246,.14),transparent_35%),#0b1220] p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">
                <ListChecks className="h-4 w-4" /> رهگیری قسمت‌ها
              </div>
              <h1 className="mt-4 text-3xl font-black sm:text-4xl">{title}</h1>
              <p className="mt-2 text-sm text-slate-400">فصل {selectedSeason} · {completed} از {episodes.length} قسمت دیده شده</p>
            </div>
            <div className="min-w-40 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>پیشرفت فصل</span>
                <span className="font-black text-blue-300">{progressPercent}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-l from-violet-500 to-blue-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>

          <nav className="mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="فصل‌ها">
            {seasons.map((item) => (
              <Link
                key={item.id}
                href={`/title/${titleId}/episodes?season=${item.season_number}`}
                className={item.season_number === selectedSeason
                  ? "flex-none rounded-xl bg-blue-500 px-4 py-2 text-sm font-black text-white"
                  : "flex-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/[0.07]"}
              >
                فصل {item.season_number}
              </Link>
            ))}
          </nav>
        </header>

        <section className="mt-6 grid gap-3">
          {episodes.map((episode) => {
            const isWatched = watched.has(episode.episode_number);
            return (
              <article key={episode.id} className="rounded-2xl border border-white/10 bg-[#0b1220]/85 p-4 sm:p-5">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs font-black text-slate-300">قسمت {episode.episode_number}</span>
                      {isWatched && <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-black text-emerald-300">دیده شده</span>}
                      {episode.runtime ? <span className="text-xs text-slate-500">{episode.runtime} دقیقه</span> : null}
                    </div>
                    <h2 className="mt-3 text-lg font-black text-white sm:text-xl">{episode.name || `قسمت ${episode.episode_number}`}</h2>
                    {episode.overview ? <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-400">{episode.overview}</p> : null}
                    {episode.air_date ? <p className="mt-2 text-xs text-slate-600">انتشار: {episode.air_date}</p> : null}
                  </div>

                  <div className="grid gap-2">
                    <EpisodeProgressButton
                      titleId={titleId}
                      seasonNumber={selectedSeason}
                      episodeNumber={episode.episode_number}
                      initiallyWatched={isWatched}
                    />
                    {!isWatched && episode.episode_number === episodes.find((item) => !watched.has(item.episode_number))?.episode_number ? (
                      <div className="flex items-center justify-center gap-2 rounded-xl border border-violet-400/15 bg-violet-500/10 px-3 py-2 text-xs font-black text-violet-300">
                        <PlayCircle className="h-4 w-4" /> قسمت بعدی تو
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
