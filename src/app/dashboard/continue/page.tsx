import { redirect } from "next/navigation";

import ContinueWatchingPanel, {
  type ContinueWatchingItem as ContinueWatchingPanelItem,
} from "@/components/ContinueWatchingPanel";
import {
  deriveContinueWatching,
  type EpisodeDescriptor,
  type EpisodeProgressEntry,
} from "@/lib/episode-progress";
import { createClient } from "@/lib/supabase/server";
import { fetchJson } from "@/lib/tmdb";

type TmdbTvDetails = {
  id: number;
  name?: string;
  seasons?: Array<{
    season_number: number;
    episode_count: number;
  }>;
};

type TmdbSeasonDetails = {
  episodes?: Array<{
    episode_number: number;
    name?: string;
    air_date?: string | null;
  }>;
};

export default async function ContinueWatchingPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect("/auth");

  const [{ data: progressRows }, { data: watchingRows }] = await Promise.all([
    supabase
      .from("episode_progress")
      .select("title_id, season_number, episode_number, watched_at")
      .eq("user_id", userId)
      .order("watched_at", { ascending: false }),
    supabase
      .from("user_lists")
      .select("title_id, title_type, status")
      .eq("user_id", userId)
      .eq("title_type", "tv")
      .eq("status", "watching"),
  ]);

  const apiKey = process.env.TMDB_API_KEY;
  const progress: EpisodeProgressEntry[] = (progressRows ?? []).map((row) => ({
    titleId: row.title_id,
    seasonNumber: row.season_number,
    episodeNumber: row.episode_number,
    watchedAt: row.watched_at,
  }));

  if (!apiKey || progress.length === 0 || !watchingRows?.length) {
    return (
      <main className="min-h-screen bg-[#050914] px-4 pb-16 pt-24 text-white" dir="rtl">
        <div className="mx-auto max-w-5xl">
          <ContinueWatchingPanel items={[]} />
        </div>
      </main>
    );
  }

  const watchedTitleIds = new Set(progress.map((entry) => entry.titleId));
  const titleIds = [...new Set(
    watchingRows
      .map((row) => row.title_id)
      .filter((titleId) => watchedTitleIds.has(titleId)),
  )];

  const titleDetails = await Promise.all(
    titleIds.map(async (titleId) => {
      const details = await fetchJson<TmdbTvDetails>(
        `https://api.themoviedb.org/3/tv/${titleId}?api_key=${apiKey}&language=fa-IR`,
        { next: { revalidate: 3600 } },
      );
      return details ? { titleId, details } : null;
    }),
  );

  const episodes: EpisodeDescriptor[] = [];
  const titleNames = new Map<number, string>();

  for (const item of titleDetails) {
    if (!item) continue;
    titleNames.set(item.titleId, item.details.name || `سریال ${item.titleId}`);

    const seasons = (item.details.seasons ?? []).filter(
      (season) => season.season_number > 0 && season.episode_count > 0,
    );

    const seasonDetails = await Promise.all(
      seasons.map((season) =>
        fetchJson<TmdbSeasonDetails>(
          `https://api.themoviedb.org/3/tv/${item.titleId}/season/${season.season_number}?api_key=${apiKey}&language=fa-IR`,
          { next: { revalidate: 3600 } },
        ).then((details) => ({ seasonNumber: season.season_number, details })),
      ),
    );

    for (const season of seasonDetails) {
      for (const episode of season.details?.episodes ?? []) {
        episodes.push({
          titleId: item.titleId,
          seasonNumber: season.seasonNumber,
          episodeNumber: episode.episode_number,
          name: episode.name,
          airDate: episode.air_date,
        });
      }
    }
  }

  const items: ContinueWatchingPanelItem[] = deriveContinueWatching(episodes, progress)
    .filter((item) => item.nextEpisode)
    .map((item) => ({
      titleId: item.titleId,
      name: titleNames.get(item.titleId) || `سریال ${item.titleId}`,
      seasonNumber: item.nextEpisode!.seasonNumber,
      episodeNumber: item.nextEpisode!.episodeNumber,
      progressPercent: item.progressPercent,
      href: `/title/${item.titleId}/episodes?season=${item.nextEpisode!.seasonNumber}`,
    }));

  return (
    <main className="min-h-screen bg-[#050914] px-4 pb-16 pt-24 text-white" dir="rtl">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-xs font-black text-blue-300">FilmTrack</p>
          <h1 className="mt-2 text-3xl font-black">ادامه تماشا</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            سریال‌هایی که شروع کرده‌ای، با قسمت بعدی و درصد پیشرفت واقعی.
          </p>
        </div>
        <ContinueWatchingPanel items={items} />
      </div>
    </main>
  );
}
