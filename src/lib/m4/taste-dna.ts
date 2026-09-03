export type TitleType = "movie" | "tv";

export type TasteMetadata = {
  titleId: number;
  titleType: TitleType;
  genres: string[];
  people: string[];
  countries: string[];
  languages: string[];
  year?: number | null;
};

export type TasteSignal = {
  titleId: number;
  titleType: TitleType;
  weight: number;
  watches: number;
  rating?: number | null;
};

export type TasteBreakdown = {
  label: string;
  score: number;
  count: number;
};

export type TasteDNA = {
  genres: TasteBreakdown[];
  people: TasteBreakdown[];
  countries: TasteBreakdown[];
  languages: TasteBreakdown[];
  decades: TasteBreakdown[];
  averageRating: number | null;
  ratingStrictness: "سخت‌گیر" | "متعادل" | "دست‌ودلباز" | "نامشخص";
  rewatchRate: number;
  movieShare: number;
  tvShare: number;
  sampleSize: number;
};

function key(titleId: number, titleType: TitleType) {
  return `${titleType}:${titleId}`;
}

function addMetric(map: Map<string, { score: number; count: number }>, label: string, score: number) {
  const normalized = label.trim();
  if (!normalized) return;
  const current = map.get(normalized) || { score: 0, count: 0 };
  current.score += score;
  current.count += 1;
  map.set(normalized, current);
}

function top(map: Map<string, { score: number; count: number }>, limit = 8): TasteBreakdown[] {
  return [...map.entries()]
    .map(([label, value]) => ({ label, score: Math.round(value.score * 100) / 100, count: value.count }))
    .sort((a, b) => b.score - a.score || b.count - a.count || a.label.localeCompare(b.label, "fa"))
    .slice(0, limit);
}

export function decadeLabel(year?: number | null) {
  if (!year || year < 1880 || year > 2100) return null;
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

export function computeTasteDNA({ metadata, signals }: { metadata: TasteMetadata[]; signals: TasteSignal[] }): TasteDNA {
  const metaByKey = new Map(metadata.map((item) => [key(item.titleId, item.titleType), item]));
  const genres = new Map<string, { score: number; count: number }>();
  const people = new Map<string, { score: number; count: number }>();
  const countries = new Map<string, { score: number; count: number }>();
  const languages = new Map<string, { score: number; count: number }>();
  const decades = new Map<string, { score: number; count: number }>();

  let ratingSum = 0;
  let ratingCount = 0;
  let watches = 0;
  let rewatches = 0;
  let movieWeight = 0;
  let tvWeight = 0;

  for (const signal of signals) {
    const meta = metaByKey.get(key(signal.titleId, signal.titleType));
    if (!meta) continue;
    const weight = Math.max(0.5, signal.weight);
    for (const label of meta.genres) addMetric(genres, label, weight);
    for (const label of meta.people) addMetric(people, label, weight);
    for (const label of meta.countries) addMetric(countries, label, weight);
    for (const label of meta.languages) addMetric(languages, label, weight);
    const decade = decadeLabel(meta.year);
    if (decade) addMetric(decades, decade, weight);

    if (signal.rating && Number.isFinite(signal.rating)) {
      ratingSum += signal.rating;
      ratingCount += 1;
    }
    watches += Math.max(1, signal.watches);
    rewatches += Math.max(0, signal.watches - 1);
    if (signal.titleType === "movie") movieWeight += weight;
    else tvWeight += weight;
  }

  const averageRating = ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : null;
  const ratingStrictness = averageRating == null ? "نامشخص" : averageRating < 6.5 ? "سخت‌گیر" : averageRating > 8 ? "دست‌ودلباز" : "متعادل";
  const typeTotal = movieWeight + tvWeight;

  return {
    genres: top(genres),
    people: top(people),
    countries: top(countries),
    languages: top(languages),
    decades: top(decades),
    averageRating,
    ratingStrictness,
    rewatchRate: watches ? Math.round((rewatches / watches) * 100) : 0,
    movieShare: typeTotal ? Math.round((movieWeight / typeTotal) * 100) : 0,
    tvShare: typeTotal ? Math.round((tvWeight / typeTotal) * 100) : 0,
    sampleSize: signals.length,
  };
}
