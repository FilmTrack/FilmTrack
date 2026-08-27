import SearchResultsGrid from "@/components/search/SearchResultsGrid";
import { fetchJson, type TmdbMediaSummary } from "@/lib/tmdb";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  let results: TmdbMediaSummary[] = [];

  if (query) {
    const data = await fetchJson<TmdbMediaSummary[]>(
      `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/search?q=${encodeURIComponent(query)}`,
    );

    results = data ?? [];
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-2xl text-white">
        نتایج جستجو برای: {query}
      </h1>

      <SearchResultsGrid results={results} />
    </main>
  );
}
