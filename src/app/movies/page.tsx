import Link from "next/link";

import TmdbImage from "@/components/TmdbImage";
import {
  fetchJson,
  type TmdbMediaSummary,
  type TmdbSearchResponse,
} from "@/lib/tmdb";

async function fetchMovies(): Promise<TmdbMediaSummary[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [];

  const url = new URL("https://api.themoviedb.org/3/movie/popular");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const data = await fetchJson<TmdbSearchResponse>(url);
  return data?.results ?? [];
}

export default async function MoviesPage() {
  const movies = await fetchMovies();

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 border-r-4 border-blue-600 pr-3">
          فیلم‌های محبوب
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {movies.map((movie) => (
            <Link
              href={`/title/${movie.id}?type=movie`}
              key={movie.id}
              className="group"
            >
              <div className="w-full aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden transition-transform group-hover:scale-105">
                {movie.poster_path && (
                  <TmdbImage
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title || "Movie poster"}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <p className="mt-2 text-sm text-gray-400 truncate group-hover:text-white">
                {movie.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
