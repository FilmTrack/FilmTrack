import type { TasteDNA, TitleType } from "./taste-dna";

export type RecommendationContext = {
  titleType: "any" | TitleType;
  time: "any" | "short" | "standard" | "long";
  discovery: "balanced" | "familiar" | "explore";
};

export type ContextCandidate = {
  titleId: number;
  titleType: TitleType;
  genres: string[];
  people: string[];
  countries: string[];
  languages: string[];
  year?: number | null;
  runtimeMinutes?: number | null;
  episodeRuntimeMinutes?: number | null;
  popularity?: number | null;
  voteAverage?: number | null;
};

export type RankedContextCandidate = ContextCandidate & {
  score: number;
  reasons: string[];
};

function normalizedMap(items: Array<{ label: string; score: number }>) {
  const max = Math.max(1, ...items.map((item) => item.score));
  return new Map(items.map((item) => [item.label.toLocaleLowerCase("fa"), item.score / max]));
}

function featureScore(values: string[], map: Map<string, number>) {
  return values.reduce((sum, value) => sum + (map.get(value.toLocaleLowerCase("fa")) || 0), 0);
}

function decade(year?: number | null) {
  if (!year) return null;
  return `${Math.floor(year / 10) * 10}s`;
}

function runtimeFit(candidate: ContextCandidate, time: RecommendationContext["time"]) {
  if (time === "any") return 0;
  const minutes = candidate.titleType === "movie" ? candidate.runtimeMinutes : candidate.episodeRuntimeMinutes;
  if (!minutes) return 0;
  if (time === "short") return minutes <= 45 ? 1 : minutes <= 90 ? 0.35 : -0.6;
  if (time === "standard") return minutes >= 46 && minutes <= 130 ? 1 : 0;
  return minutes > 130 ? 1 : minutes >= 90 ? 0.35 : -0.4;
}

export function rankContextualRecommendations({
  dna,
  candidates,
  context,
  excludedKeys = new Set<string>(),
  limit = 18,
}: {
  dna: TasteDNA;
  candidates: ContextCandidate[];
  context: RecommendationContext;
  excludedKeys?: Set<string>;
  limit?: number;
}): RankedContextCandidate[] {
  const genreMap = normalizedMap(dna.genres);
  const peopleMap = normalizedMap(dna.people);
  const countryMap = normalizedMap(dna.countries);
  const languageMap = normalizedMap(dna.languages);
  const decadeMap = normalizedMap(dna.decades);

  const ranked = candidates
    .filter((candidate) => !excludedKeys.has(`${candidate.titleType}:${candidate.titleId}`))
    .filter((candidate) => context.titleType === "any" || candidate.titleType === context.titleType)
    .map((candidate) => {
      const genreAffinity = featureScore(candidate.genres, genreMap);
      const peopleAffinity = featureScore(candidate.people, peopleMap);
      const countryAffinity = featureScore(candidate.countries, countryMap);
      const languageAffinity = featureScore(candidate.languages, languageMap);
      const decadeAffinity = decade(candidate.year) ? decadeMap.get(decade(candidate.year)!.toLocaleLowerCase("fa")) || 0 : 0;
      const affinity = genreAffinity * 3 + peopleAffinity * 2.2 + countryAffinity * 1.2 + languageAffinity + decadeAffinity * 1.2;
      const quality = Math.max(0, Math.min(1, ((candidate.voteAverage || 0) - 5) / 4));
      const popularity = Math.min(1, Math.log10(Math.max(1, candidate.popularity || 1)) / 4);
      const timeFit = runtimeFit(candidate, context.time);
      const familiarityFactor = context.discovery === "familiar" ? 1.25 : context.discovery === "explore" ? 0.65 : 1;
      const noveltyBoost = context.discovery === "explore" ? Math.max(0, 1.4 - affinity) : 0;
      const score = affinity * familiarityFactor + quality * 1.4 + popularity * 0.35 + timeFit * 1.4 + noveltyBoost;

      const reasons: string[] = [];
      const matchedGenres = candidate.genres.filter((value) => genreMap.has(value.toLocaleLowerCase("fa"))).slice(0, 2);
      const matchedPeople = candidate.people.filter((value) => peopleMap.has(value.toLocaleLowerCase("fa"))).slice(0, 1);
      if (matchedGenres.length) reasons.push(`با ژانرهای محبوبت مثل ${matchedGenres.join(" و ")} هم‌راستاست`);
      if (matchedPeople.length) reasons.push(`${matchedPeople[0]} در DNA سینمایی تو سیگنال قوی دارد`);
      if (timeFit >= 0.9 && context.time !== "any") reasons.push("با زمانی که برای تماشا انتخاب کردی جور است");
      if (context.discovery === "explore" && noveltyBoost > 0.45) reasons.push("برای کشف چیزی تازه‌تر از الگوی همیشگی انتخاب شده");
      if (!reasons.length) reasons.push("ترکیب کیفیت عنوان و الگوی کلی سلیقه تو امتیاز بالایی داده است");

      return { ...candidate, score: Math.round(score * 1000) / 1000, reasons };
    })
    .sort((a, b) => b.score - a.score || (b.voteAverage || 0) - (a.voteAverage || 0));

  // Diversity pass: avoid filling the first page with one dominant genre.
  const result: RankedContextCandidate[] = [];
  const primaryGenreCount = new Map<string, number>();
  for (const candidate of ranked) {
    const primary = candidate.genres[0] || "__none";
    const used = primaryGenreCount.get(primary) || 0;
    if (used >= Math.max(2, Math.ceil(limit / 4))) continue;
    result.push(candidate);
    primaryGenreCount.set(primary, used + 1);
    if (result.length >= limit) break;
  }
  return result;
}
