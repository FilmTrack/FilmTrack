export type DiscoveryMediaType = "movie" | "tv";

export type DiscoveryIntent = {
  raw: string;
  mediaType: DiscoveryMediaType;
  genreIds: number[];
  moodLabels: string[];
  maxRuntimeMinutes?: number;
  minYear?: number;
  maxYear?: number;
  sortBy: "popularity.desc" | "vote_average.desc";
  explanation: string[];
};

const GENRES: Array<{ id: number; labels: string[]; display: string }> = [
  { id: 28, labels: ["اکشن", "action", "هیجانی", "پر زد و خورد"], display: "اکشن" },
  { id: 35, labels: ["کمدی", "طنز", "خنده دار", "خنده‌دار", "comedy"], display: "کمدی" },
  { id: 18, labels: ["درام", "احساسی", "غمگین", "دراماتیک", "drama"], display: "درام" },
  { id: 27, labels: ["ترسناک", "وحشت", "هارور", "horror"], display: "ترسناک" },
  { id: 878, labels: ["علمی تخیلی", "علمی‌تخیلی", "سای فای", "سای‌فای", "scifi", "sci fi"], display: "علمی‌تخیلی" },
  { id: 53, labels: ["معمایی", "هیجان انگیز", "هیجان‌انگیز", "thriller"], display: "هیجان‌انگیز" },
  { id: 10749, labels: ["عاشقانه", "رمانتیک", "romance"], display: "عاشقانه" },
  { id: 14, labels: ["فانتزی", "fantasy"], display: "فانتزی" },
  { id: 16, labels: ["انیمیشن", "انیمه", "animation", "anime"], display: "انیمیشن" },
  { id: 80, labels: ["جنایی", "crime"], display: "جنایی" },
  { id: 99, labels: ["مستند", "documentary"], display: "مستند" },
];

function normalize(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replaceAll("ي", "ی")
    .replaceAll("ك", "ک")
    .replaceAll("‌", " ")
    .replace(/\s+/g, " ");
}

function includesAny(text: string, labels: string[]) {
  return labels.some((label) => text.includes(normalize(label)));
}

export function parsePersianDiscoveryIntent(input: string): DiscoveryIntent {
  const raw = input.trim();
  const text = normalize(raw);
  const explanation: string[] = [];
  const moodLabels: string[] = [];

  const mediaType: DiscoveryMediaType = includesAny(text, ["سریال", "series", "show", "tv"])
    ? "tv"
    : "movie";
  explanation.push(mediaType === "tv" ? "سریال" : "فیلم");

  const genreIds: number[] = [];
  for (const genre of GENRES) {
    if (includesAny(text, genre.labels)) {
      genreIds.push(genre.id);
      explanation.push(genre.display);
    }
  }

  if (includesAny(text, ["حال خوب", "حال‌خوب", "امیدبخش", "uplifting", "feel good", "آرامش بخش", "آرامش‌بخش"])) {
    moodLabels.push("امیدبخش");
    if (!genreIds.includes(35)) genreIds.push(35);
    explanation.push("حال‌خوب/امیدبخش");
  }

  if (includesAny(text, ["غمگین", "تلخ", "sad", "غم انگیز", "غم‌انگیز"])) {
    moodLabels.push("غمگین");
    if (!genreIds.includes(18)) genreIds.push(18);
    explanation.push("غمگین");
  }

  if (includesAny(text, ["تاریک", "دارک", "dark", "سنگین"])) {
    moodLabels.push("تاریک");
    explanation.push("فضای تاریک");
  }

  if (includesAny(text, ["سبک", "راحت", "easy watch", "ریلکس", "ریلکس کننده", "ریلکس‌کننده"])) {
    moodLabels.push("سبک");
    explanation.push("تماشای سبک");
  }

  let maxRuntimeMinutes: number | undefined;
  if (includesAny(text, ["کوتاه", "کم زمان", "کم‌زمان", "زیر دو ساعت", "short"])) {
    maxRuntimeMinutes = mediaType === "movie" ? 120 : 45;
    explanation.push(mediaType === "movie" ? "حداکثر ۱۲۰ دقیقه" : "قسمت‌های کوتاه‌تر");
  }

  const currentYear = new Date().getUTCFullYear();
  let minYear: number | undefined;
  let maxYear: number | undefined;
  if (includesAny(text, ["جدید", "تازه", "recent", "امسال", "چند سال اخیر"])) {
    minYear = currentYear - 4;
    explanation.push("چند سال اخیر");
  } else if (includesAny(text, ["قدیمی", "کلاسیک", "classic"])) {
    maxYear = 2000;
    explanation.push("کلاسیک/قدیمی");
  }

  const sortBy = includesAny(text, ["بهترین", "امتیاز بالا", "امتیازبالا", "top rated", "برتر"])
    ? "vote_average.desc"
    : "popularity.desc";
  if (sortBy === "vote_average.desc") explanation.push("امتیاز بالاتر");

  return {
    raw,
    mediaType,
    genreIds: [...new Set(genreIds)],
    moodLabels: [...new Set(moodLabels)],
    maxRuntimeMinutes,
    minYear,
    maxYear,
    sortBy,
    explanation: [...new Set(explanation)],
  };
}

export function buildTmdbDiscoverPath(intent: DiscoveryIntent) {
  const params = new URLSearchParams();
  params.set("sort_by", intent.sortBy);
  params.set("include_adult", "false");
  params.set("vote_count.gte", intent.sortBy === "vote_average.desc" ? "100" : "30");

  if (intent.genreIds.length > 0) params.set("with_genres", intent.genreIds.join(","));
  if (intent.maxRuntimeMinutes) params.set("with_runtime.lte", String(intent.maxRuntimeMinutes));

  if (intent.mediaType === "movie") {
    if (intent.minYear) params.set("primary_release_date.gte", `${intent.minYear}-01-01`);
    if (intent.maxYear) params.set("primary_release_date.lte", `${intent.maxYear}-12-31`);
  } else {
    if (intent.minYear) params.set("first_air_date.gte", `${intent.minYear}-01-01`);
    if (intent.maxYear) params.set("first_air_date.lte", `${intent.maxYear}-12-31`);
  }

  return `/discover/${intent.mediaType}?${params.toString()}`;
}
