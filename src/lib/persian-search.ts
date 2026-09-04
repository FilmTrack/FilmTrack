export function normalizePersianText(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("fa-IR")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ۀ/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/[إأٱآ]/g, "ا")
    .replace(/ـ/g, "")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[\u200c\u200d]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchQueryVariants(value: string) {
  const original = value.trim();
  const normalized = normalizePersianText(original);
  return [...new Set([original, normalized].filter(Boolean))];
}

type RankableTitle = {
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
};

function candidateNames(item: RankableTitle) {
  return [item.title, item.name, item.original_title, item.original_name]
    .filter((value): value is string => Boolean(value?.trim()))
    .map(normalizePersianText);
}

export function searchMatchScore(item: RankableTitle, query: string) {
  const needle = normalizePersianText(query);
  if (!needle) return 0;
  const names = candidateNames(item);
  if (names.some((name) => name === needle)) return 100;
  if (names.some((name) => name.startsWith(needle))) return 80;
  if (names.some((name) => name.includes(needle))) return 60;

  const queryTokens = needle.split(" ").filter(Boolean);
  const bestTokenCoverage = names.reduce((best, name) => {
    if (!queryTokens.length) return best;
    const covered = queryTokens.filter((token) => name.includes(token)).length;
    return Math.max(best, covered / queryTokens.length);
  }, 0);
  return Math.round(bestTokenCoverage * 40);
}

export function rankSearchResults<T extends RankableTitle>(items: T[], query: string) {
  return [...items].sort((a, b) => searchMatchScore(b, query) - searchMatchScore(a, query));
}
