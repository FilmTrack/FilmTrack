export type TitleType = "movie" | "tv";

export type TrackingSignal = {
  titleId: number;
  titleType: TitleType;
  status?: string | null;
};

export type RatingSignal = {
  titleId: number;
  titleType: TitleType;
  rating10: number;
};

export type DiarySignal = {
  titleId: number;
  titleType: TitleType;
};

export type TasteSeed = {
  titleId: number;
  titleType: TitleType;
  score: number;
  signals: string[];
};

export type RecommendationCandidate = {
  titleId: number;
  titleType: TitleType;
  score: number;
  basedOn: Array<{ titleId: number; titleType: TitleType }>;
};

export function identityKey(titleId: number, titleType: TitleType) {
  return `${titleType}:${titleId}`;
}

function ensureSeed(
  map: Map<string, TasteSeed>,
  titleId: number,
  titleType: TitleType,
) {
  const key = identityKey(titleId, titleType);
  let seed = map.get(key);
  if (!seed) {
    seed = { titleId, titleType, score: 0, signals: [] };
    map.set(key, seed);
  }
  return seed;
}

export function buildTasteSeeds({
  tracking,
  ratings,
  diary,
}: {
  tracking: TrackingSignal[];
  ratings: RatingSignal[];
  diary: DiarySignal[];
}) {
  const map = new Map<string, TasteSeed>();

  for (const item of tracking) {
    const seed = ensureSeed(map, item.titleId, item.titleType);
    if (item.status === "completed") {
      seed.score += 3;
      seed.signals.push("تماشا شده");
    } else if (item.status === "watching") {
      seed.score += 1;
      seed.signals.push("در حال تماشا");
    }
  }

  for (const item of ratings) {
    if (!Number.isFinite(item.rating10) || item.rating10 < 7) continue;
    const seed = ensureSeed(map, item.titleId, item.titleType);
    seed.score += item.rating10 >= 9 ? 6 : item.rating10 >= 8 ? 4 : 2;
    seed.signals.push(`امتیاز ${item.rating10}/10`);
  }

  const diaryCounts = new Map<string, number>();
  for (const item of diary) {
    const key = identityKey(item.titleId, item.titleType);
    diaryCounts.set(key, (diaryCounts.get(key) || 0) + 1);
    ensureSeed(map, item.titleId, item.titleType);
  }

  for (const seed of map.values()) {
    const count = diaryCounts.get(identityKey(seed.titleId, seed.titleType)) || 0;
    if (count > 0) {
      seed.score += Math.min(5, count * 2);
      seed.signals.push(count > 1 ? `${count} بار تماشا` : "ثبت در دفترچه تماشا");
    }
  }

  return [...map.values()]
    .filter((seed) => seed.score > 0)
    .sort((a, b) => b.score - a.score || a.titleId - b.titleId);
}

export function rankRecommendationCandidates({
  seed,
  candidates,
  excludedKeys,
}: {
  seed: TasteSeed;
  candidates: Array<{ id: number; titleType: TitleType; popularity?: number; voteAverage?: number }>;
  excludedKeys: Set<string>;
}) {
  return candidates
    .filter((item) => !excludedKeys.has(identityKey(item.id, item.titleType)))
    .map((item) => ({
      titleId: item.id,
      titleType: item.titleType,
      score: seed.score * 10 + (item.voteAverage || 0) + Math.min(5, (item.popularity || 0) / 100),
      basedOn: [{ titleId: seed.titleId, titleType: seed.titleType }],
    } satisfies RecommendationCandidate));
}

export function mergeRecommendationCandidates(groups: RecommendationCandidate[][], limit = 18) {
  const merged = new Map<string, RecommendationCandidate>();

  for (const candidate of groups.flat()) {
    const key = identityKey(candidate.titleId, candidate.titleType);
    const current = merged.get(key);
    if (!current) {
      merged.set(key, { ...candidate, basedOn: [...candidate.basedOn] });
      continue;
    }

    current.score += candidate.score;
    for (const seed of candidate.basedOn) {
      if (!current.basedOn.some((item) => identityKey(item.titleId, item.titleType) === identityKey(seed.titleId, seed.titleType))) {
        current.basedOn.push(seed);
      }
    }
  }

  return [...merged.values()]
    .sort((a, b) => b.score - a.score || a.titleId - b.titleId)
    .slice(0, limit);
}
