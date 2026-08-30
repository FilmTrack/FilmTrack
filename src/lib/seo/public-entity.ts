import type { Metadata } from "next";

import type { TmdbTitleDetails, TmdbMediaType } from "@/lib/tmdb";

export const FILMTRACK_BASE_URL = "https://www.filmtrack.ir";
export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w780";

const genreNames: Record<string, string> = {
  "28": "اکشن",
  "12": "ماجراجویی",
  "16": "انیمیشن",
  "35": "کمدی",
  "80": "جنایی",
  "99": "مستند",
  "18": "درام",
  "10751": "خانوادگی",
  "14": "فانتزی",
  "36": "تاریخی",
  "27": "ترسناک",
  "10402": "موزیکال",
  "9648": "معمایی",
  "10749": "عاشقانه",
  "878": "علمی-تخیلی",
  "53": "هیجان‌انگیز",
  "10752": "جنگی",
  "37": "وسترن",
};

export function canonicalTitleUrl(id: string | number, type: TmdbMediaType) {
  const encodedId = encodeURIComponent(String(id));
  return `${FILMTRACK_BASE_URL}/title/${encodedId}?type=${type}`;
}

export function canonicalGenreUrl(id: string | number) {
  return `${FILMTRACK_BASE_URL}/genre/${encodeURIComponent(String(id))}`;
}

function compactDescription(value: string | undefined, fallback: string) {
  const normalized = value?.replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  return normalized.length > 155 ? `${normalized.slice(0, 152).trimEnd()}…` : normalized;
}

export function buildTitleMetadata({
  id,
  type,
  data,
  localizedTitle,
  localizedOverview,
}: {
  id: string | number;
  type: TmdbMediaType;
  data: TmdbTitleDetails;
  localizedTitle?: string;
  localizedOverview?: string;
}): Metadata {
  const originalTitle = data.title || data.name || "FilmTrack";
  const title = localizedTitle || originalTitle;
  const kindLabel = type === "tv" ? "سریال" : "فیلم";
  const canonical = canonicalTitleUrl(id, type);
  const description = compactDescription(
    localizedOverview || data.overview,
    `اطلاعات، امتیازها و جزئیات ${kindLabel} ${title} در FilmTrack.`,
  );
  const poster = data.poster_path ? `${TMDB_IMAGE_BASE_URL}${data.poster_path}` : undefined;

  return {
    // Root layout owns the final `| FilmTrack` suffix through its title template.
    title: `${title} | ${kindLabel}`,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: `${title} | FilmTrack`,
      description,
      siteName: "FilmTrack",
      locale: "fa_IR",
      images: poster ? [{ url: poster, alt: title }] : undefined,
    },
    twitter: {
      card: poster ? "summary_large_image" : "summary",
      title: `${title} | FilmTrack`,
      description,
      images: poster ? [poster] : undefined,
    },
  };
}

export function buildTitleStructuredData({
  id,
  type,
  data,
  localizedTitle,
  localizedOverview,
}: {
  id: string | number;
  type: TmdbMediaType;
  data: TmdbTitleDetails;
  localizedTitle?: string;
  localizedOverview?: string;
}) {
  const title = localizedTitle || data.title || data.name || "FilmTrack title";
  const canonical = canonicalTitleUrl(id, type);
  const poster = data.poster_path ? `${TMDB_IMAGE_BASE_URL}${data.poster_path}` : undefined;
  const datePublished = data.release_date || data.first_air_date || undefined;
  const description = compactDescription(
    localizedOverview || data.overview,
    `جزئیات ${type === "tv" ? "سریال" : "فیلم"} ${title} در FilmTrack.`,
  );

  const entity = {
    "@type": type === "tv" ? "TVSeries" : "Movie",
    "@id": `${canonical}#entity`,
    url: canonical,
    name: title,
    alternateName: data.title || data.name || undefined,
    description,
    image: poster,
    datePublished,
    genre: data.genres?.map((genre) => genre.name),
    aggregateRating:
      typeof data.vote_average === "number" && typeof data.vote_count === "number" && data.vote_count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(data.vote_average.toFixed(1)),
            bestRating: 10,
            worstRating: 0,
            ratingCount: data.vote_count,
          }
        : undefined,
  };

  const breadcrumb = {
    "@type": "BreadcrumbList",
    "@id": `${canonical}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "FilmTrack",
        item: FILMTRACK_BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: type === "tv" ? "سریال‌ها" : "فیلم‌ها",
        item: `${FILMTRACK_BASE_URL}/${type === "tv" ? "shows" : "movies"}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: canonical,
      },
    ],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [entity, breadcrumb],
  };
}

export function getGenreName(id: string | number) {
  return genreNames[String(id)] || "ژانر";
}

export function buildGenreMetadata(id: string | number, page?: number): Metadata {
  const genreName = getGenreName(id);
  const canonical = canonicalGenreUrl(id);
  const isPaginated = typeof page === "number" && page > 0;
  const pageTitle = isPaginated
    ? `فیلم‌های ژانر ${genreName} – صفحه ${page}`
    : `بهترین فیلم‌های ژانر ${genreName}`;
  const socialTitle = `${pageTitle} | FilmTrack`;
  const description = `فیلم‌های محبوب و برتر ژانر ${genreName} را در FilmTrack کشف و دنبال کنید.`;

  return {
    // Root layout appends the brand once; social cards own their complete title.
    title: pageTitle,
    description,
    alternates: { canonical },
    robots: isPaginated ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      url: canonical,
      title: socialTitle,
      description,
      siteName: "FilmTrack",
      locale: "fa_IR",
    },
    twitter: {
      card: "summary",
      title: socialTitle,
      description,
    },
  };
}

export function buildGenreBreadcrumb(id: string | number) {
  const genreName = getGenreName(id);
  const canonical = canonicalGenreUrl(id);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${canonical}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "FilmTrack",
        item: FILMTRACK_BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "ژانرها",
        item: `${FILMTRACK_BASE_URL}/genres`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: genreName,
        item: canonical,
      },
    ],
  };
}
