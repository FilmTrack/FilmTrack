import { NextResponse } from "next/server";

import {
  fetchJson,
  type TmdbMediaSummary,
  type TmdbSearchResponse,
} from "@/lib/tmdb";

function isSupportedMedia(
  item: TmdbMediaSummary,
): item is TmdbMediaSummary & { media_type: "movie" | "tv" } {
  return item.media_type === "movie" || item.media_type === "tv";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) return NextResponse.json([]);

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return NextResponse.json([]);

  const url = new URL("https://api.themoviedb.org/3/search/multi");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const data = await fetchJson<TmdbSearchResponse>(url);
  const results = (data?.results ?? []).filter(isSupportedMedia);

  return NextResponse.json(results.slice(0, 7));
}
