import { NextResponse } from "next/server";

import { fetchJson, type TmdbMediaSummary, type TmdbSearchResponse } from "@/lib/tmdb";
import { rankSearchResults, searchQueryVariants } from "@/lib/persian-search";
import { logServerEvent, requestId } from "@/lib/observability";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const buckets = new Map<string, { count: number; resetAt: number }>();

function isSupportedMedia(item: TmdbMediaSummary): item is TmdbMediaSummary & { media_type: "movie" | "tv" } {
  return item.media_type === "movie" || item.media_type === "tv";
}

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  buckets.set(key, current);
  return current.count > MAX_REQUESTS;
}

function canonicalResultKey(item: TmdbMediaSummary & { media_type: "movie" | "tv" }) {
  return `${item.media_type}:${item.id}`;
}

async function searchTmdb(apiKey: string, query: string, language: "fa-IR" | "en-US") {
  const url = new URL("https://api.themoviedb.org/3/search/multi");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("language", language);
  url.searchParams.set("page", "1");
  return fetchJson<TmdbSearchResponse>(url);
}

export async function GET(request: Request) {
  const rid = requestId(request);
  const key = clientKey(request);
  if (isRateLimited(key)) {
    logServerEvent("search.rate_limited", { request_id: rid }, "warn");
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60", "X-Request-Id": rid } });
  }

  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q")?.trim();
  if (!rawQuery) return NextResponse.json([], { headers: { "Cache-Control": "no-store", "X-Request-Id": rid } });

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    logServerEvent("search.missing_tmdb_key", { request_id: rid }, "error");
    return NextResponse.json([], { headers: { "Cache-Control": "no-store", "X-Request-Id": rid } });
  }

  const variants = searchQueryVariants(rawQuery);
  const startedAt = Date.now();
  try {
    const responses = await Promise.all(variants.flatMap((query) => [searchTmdb(apiKey, query, "fa-IR"), searchTmdb(apiKey, query, "en-US")]));
    const merged = new Map<string, TmdbMediaSummary & { media_type: "movie" | "tv" }>();

    for (const response of responses) {
      for (const item of response?.results ?? []) {
        if (!isSupportedMedia(item)) continue;
        const resultKey = canonicalResultKey(item);
        const existing = merged.get(resultKey);
        if (!existing) {
          merged.set(resultKey, item);
          continue;
        }
        merged.set(resultKey, {
          ...item,
          ...existing,
          title: existing.title || item.title,
          name: existing.name || item.name,
          original_title: existing.original_title || item.original_title,
          original_name: existing.original_name || item.original_name,
        });
      }
    }

    const results = rankSearchResults([...merged.values()], rawQuery).slice(0, 7);
    logServerEvent("search.completed", { request_id: rid, result_count: results.length, duration_ms: Date.now() - startedAt, variant_count: variants.length });
    return NextResponse.json(results, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300", "X-Request-Id": rid } });
  } catch {
    logServerEvent("search.failed", { request_id: rid, duration_ms: Date.now() - startedAt }, "error");
    return NextResponse.json([], { status: 502, headers: { "Cache-Control": "no-store", "X-Request-Id": rid } });
  }
}
