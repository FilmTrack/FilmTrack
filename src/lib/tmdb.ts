export type TmdbMediaType = "movie" | "tv";

export type TmdbMediaSummary = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  media_type?: string;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  original_language?: string;
};

export type TmdbSearchResponse<T = TmdbMediaSummary> = {
  results?: T[];
  total_pages?: number;
};

export type TmdbGenre = { id: number; name: string };
export type TmdbVideo = { key: string; site: string; type: string };
export type TmdbCrewMember = { id?: number; job?: string; name: string };
export type TmdbCastMember = { id: number; name: string; character?: string; profile_path?: string | null };
export type TmdbSeason = { id: number; name: string; season_number: number; episode_count: number; poster_path?: string | null; air_date?: string | null; overview?: string };
export type TmdbTitleDetails = TmdbMediaSummary & {
  imdb_id?: string;
  overview?: string;
  runtime?: number;
  episode_run_time?: number[];
  genres?: TmdbGenre[];
  videos?: { results?: TmdbVideo[] };
  credits?: { crew?: TmdbCrewMember[]; cast?: TmdbCastMember[] };
  created_by?: TmdbCrewMember[];
  seasons?: TmdbSeason[];
};
export type TmdbRating = { Source: string; Value: string };
export type OmdbResponse = { Response?: string; Ratings?: TmdbRating[] };
export type TranslationResponse = { responseData?: { translatedText?: string } };

export function hasTmdbCredential(): boolean {
  return Boolean(
    process.env.TMDB_API_READ_ACCESS_TOKEN?.trim() ||
    process.env.TMDB_ACCESS_TOKEN?.trim() ||
    process.env.TMDB_API_KEY?.trim(),
  );
}

export async function fetchTmdbJson<T>(
  input: string | URL,
  init?: RequestInit,
): Promise<T | null> {
  try {
    const token =
      process.env.TMDB_API_READ_ACCESS_TOKEN?.trim() ||
      process.env.TMDB_ACCESS_TOKEN?.trim();

    const apiKey = process.env.TMDB_API_KEY?.trim();

    if (!token && !apiKey) return null;

    const url = new URL(input.toString());

    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/json");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      url.searchParams.delete("api_key");
    } else if (apiKey) {
      url.searchParams.set("api_key", apiKey);
    }

    const response = await fetch(url.toString(), {
      ...init,
      headers,
    });

    if (!response.ok) return null;

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchJson<T>(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<T | null> {
  try {
    const response = await fetch(input, init);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
