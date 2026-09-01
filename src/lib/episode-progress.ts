export type EpisodeIdentity = {
  titleId: number;
  seasonNumber: number;
  episodeNumber: number;
};

export type EpisodeProgressEntry = EpisodeIdentity & {
  watchedAt: string;
};

export type EpisodeDescriptor = EpisodeIdentity & {
  name?: string | null;
  airDate?: string | null;
};

export type NextEpisodeResult = {
  completed: number;
  total: number;
  progressPercent: number;
  nextEpisode: EpisodeDescriptor | null;
};

function episodeKey(value: EpisodeIdentity) {
  return `${value.titleId}:${value.seasonNumber}:${value.episodeNumber}`;
}

export function normalizeEpisodeProgress(entries: EpisodeProgressEntry[]) {
  const byEpisode = new Map<string, EpisodeProgressEntry>();

  for (const entry of entries) {
    if (
      !Number.isInteger(entry.titleId) ||
      !Number.isInteger(entry.seasonNumber) ||
      !Number.isInteger(entry.episodeNumber) ||
      entry.titleId <= 0 ||
      entry.seasonNumber < 0 ||
      entry.episodeNumber <= 0
    ) {
      continue;
    }

    const key = episodeKey(entry);
    const current = byEpisode.get(key);
    if (!current || Date.parse(entry.watchedAt) >= Date.parse(current.watchedAt)) {
      byEpisode.set(key, entry);
    }
  }

  return [...byEpisode.values()].sort((a, b) => {
    if (a.titleId !== b.titleId) return a.titleId - b.titleId;
    if (a.seasonNumber !== b.seasonNumber) return a.seasonNumber - b.seasonNumber;
    return a.episodeNumber - b.episodeNumber;
  });
}

export function deriveNextEpisode(
  titleId: number,
  episodes: EpisodeDescriptor[],
  progress: EpisodeProgressEntry[],
): NextEpisodeResult {
  const canonicalEpisodes = episodes
    .filter(
      (episode) =>
        episode.titleId === titleId &&
        Number.isInteger(episode.seasonNumber) &&
        Number.isInteger(episode.episodeNumber) &&
        episode.seasonNumber >= 0 &&
        episode.episodeNumber > 0,
    )
    .sort((a, b) =>
      a.seasonNumber === b.seasonNumber
        ? a.episodeNumber - b.episodeNumber
        : a.seasonNumber - b.seasonNumber,
    );

  const watched = new Set(
    normalizeEpisodeProgress(progress)
      .filter((entry) => entry.titleId === titleId)
      .map(episodeKey),
  );

  const completed = canonicalEpisodes.filter((episode) => watched.has(episodeKey(episode))).length;
  const total = canonicalEpisodes.length;
  const nextEpisode = canonicalEpisodes.find((episode) => !watched.has(episodeKey(episode))) ?? null;
  const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { completed, total, progressPercent, nextEpisode };
}
