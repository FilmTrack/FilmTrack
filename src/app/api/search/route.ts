import { NextResponse } from "next/server";

import {
  fetchJson,
  type TmdbMediaSummary,
  type TmdbSearchResponse,
} from "@/lib/tmdb";
import { logServerEvent, requestId } from "@/lib/observability";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const buckets = new Map<string, { count: number; resetAt: number }>();

function isSupportedMedia(
  item: TmdbMediaSummary,
): item is TmdbMediaSummary & { media_type: "movie" | "tv" } {
  return item.media_type === "movie" || item.media_type === "tv";
}

function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
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

export async function GET(request: Request) {
  const rid = requestId(request);
  const key = clientKey(request);

  if (isRateLimited(key)) {
    logServerEvent("search.rate_limited", { request_id: rid }, "warn");
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": "60",
          "X-Request-Id": rid,
        },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json([], {
      headers: { "Cache-Control": "no-store", "X-Request-Id": rid },
    });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    logServerEvent("search.missing_tmdb_key", { request_id: rid }, "error");
    return NextResponse.json([], {
      headers: { "Cache-Control": "no-store", "X-Request-Id": rid },
    });
  }

  const url = new URL("https://api.themoviedb.org/3/search/multi");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const startedAt = Date.now();
  try {
    const data = await fetchJson<TmdbSearchResponse>(url);
    const results = (data?.results ?? []).filter(isSupportedMedia).slice(0, 7);

    logServerEvent("search.completed", {
      request_id: rid,
      result_count: results.length,
      duration_ms: Date.now() - startedAt,
    });

    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "X-Request-Id": rid,
      },
    });
  } catch {
    logServerEvent(
      "search.failed",
      { request_id: rid, duration_ms: Date.now() - startedAt },
      "error",
    );
    return NextResponse.json([], {
      status: 502,
      headers: { "Cache-Control": "no-store", "X-Request-Id": rid },
    });
  }
}
