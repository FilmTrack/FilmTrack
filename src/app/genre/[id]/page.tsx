import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import TmdbImage from "@/components/TmdbImage";
import { fetchJson, type TmdbMediaSummary, type TmdbSearchResponse } from "@/lib/tmdb";
import {
  buildGenreBreadcrumb,
  buildGenreMetadata,
  getGenreName,
} from "@/lib/seo/public-entity";

type GenrePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: GenrePageProps): Promise<Metadata> {
  const { id } = await params;
  const { page: pageStr } = await searchParams;
  const page = pageStr ? Number(pageStr) || 1 : undefined;
  return buildGenreMetadata(id, page);
}

export default async function GenrePage({ params, searchParams }: GenrePageProps) {
  const { id } = await params;
  const { page: pageStr } = await searchParams;
  const apiKey = process.env.TMDB_API_KEY;
  const genreName = getGenreName(id);

  const isPaginated = Boolean(pageStr);
  const currentPage = Number(pageStr) || 1;

  let top50: TmdbMediaSummary[] = [];
  let totalPages = 1;

  if (!isPaginated) {
    const fetchPages = await Promise.all([
      fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${id}&sort_by=vote_average.desc&page=1&vote_count.gte=200`,
      ),
      fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${id}&sort_by=vote_average.desc&page=2&vote_count.gte=200`,
      ),
      fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${id}&sort_by=vote_average.desc&page=3&vote_count.gte=200`,
      ),
    ]);
    const data = await Promise.all(
      fetchPages.map(async (response) =>
        response.ok
          ? ((await response.json()) as TmdbSearchResponse)
          : { results: [] },
      ),
    );
    top50 = [
      ...(data[0]?.results ?? []),
      ...(data[1]?.results ?? []),
      ...(data[2]?.results ?? []),
    ].slice(0, 50);
  } else {
    const url = new URL("https://api.themoviedb.org/3/discover/movie");
    url.searchParams.set("api_key", apiKey ?? "");
    url.searchParams.set("with_genres", id);
    url.searchParams.set("sort_by", "popularity.desc");
    url.searchParams.set("page", String(currentPage));
    url.searchParams.set("vote_count.gte", "100");

    const data = apiKey ? await fetchJson<TmdbSearchResponse>(url) : null;
    top50 = data?.results ?? [];
    totalPages = Math.min(data?.total_pages ?? 1, 50);
  }

  const breadcrumb = buildGenreBreadcrumb(id);

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white p-4 md:p-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c"),
        }}
      />

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 border-r-4 border-blue-600 pr-3">
          {isPaginated
            ? `لیست کامل فیلم‌های ${genreName} (صفحه ${currentPage})`
            : `۵۰ فیلم برتر ژانر ${genreName}`}
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {top50.map((movie, index) => (
            <Link
              href={`/title/${movie.id}?type=movie`}
              key={movie.id}
              className="group relative"
            >
              <div className="w-full aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden transition-transform group-hover:scale-105">
                {movie.poster_path && (
                  <TmdbImage
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title || "Movie poster"}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 right-2 bg-black/80 text-yellow-500 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  ⭐ {movie.vote_average?.toFixed(1)}
                </div>
                {!isPaginated && (
                  <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs p-1 rounded-tr-lg">
                    #{index + 1}
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-400 truncate group-hover:text-white">
                {movie.title}
              </p>
              <p className="text-xs text-gray-600">
                {movie.release_date
                  ? new Date(movie.release_date).getFullYear()
                  : ""}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-gray-800 pt-8">
          {!isPaginated ? (
            <Link href={`/genre/${id}?page=1`}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                مشاهده لیست کامل (صفحه بعد)
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {currentPage > 1 && (
                <Link href={`/genre/${id}?page=${currentPage - 1}`}>
                  <Button
                    variant="outline"
                    className="border-gray-700 hover:bg-gray-800"
                  >
                    صفحه قبل
                  </Button>
                </Link>
              )}

              {Array.from(
                { length: Math.min(totalPages, 10) },
                (_, i) => i + 1,
              ).map((page) => (
                <Link href={`/genre/${id}?page=${page}`} key={page}>
                  <Button
                    variant={page === currentPage ? "default" : "outline"}
                    className={
                      page === currentPage
                        ? "bg-blue-600"
                        : "border-gray-700 hover:bg-gray-800"
                    }
                  >
                    {page}
                  </Button>
                </Link>
              ))}

              {currentPage < totalPages && (
                <Link href={`/genre/${id}?page=${currentPage + 1}`}>
                  <Button
                    variant="outline"
                    className="border-gray-700 hover:bg-gray-800"
                  >
                    صفحه بعد
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
