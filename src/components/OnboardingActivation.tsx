"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import TmdbImage from "@/components/TmdbImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackProductEvent } from "@/lib/product-events";
import { saveWatchStatus } from "@/lib/watchlist-client";

type SearchResult = {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type: "movie" | "tv";
};

const ACTIVATION_TARGET = 3;

export default function OnboardingActivation({
  initialCount,
}: {
  initialCount: number;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [count, setCount] = useState(Math.min(initialCount, ACTIVATION_TARGET));
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());
  const lastTrackedQuery = useRef("");

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        if (lastTrackedQuery.current !== normalized) {
          lastTrackedQuery.current = normalized;
          void trackProductEvent("search_submitted", {
            source: "onboarding",
            query_length: normalized.length,
          });
        }

        const params = new URLSearchParams({ q: normalized });
        const response = await fetch(`/api/search?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("search_failed");
        setResults((await response.json()) as SearchResult[]);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const addTitle = async (item: SearchResult) => {
    const key = `${item.media_type}:${item.id}`;
    if (addedKeys.has(key)) return;

    setAddingId(item.id);
    try {
      const result = await saveWatchStatus({
        titleId: item.id,
        titleType: item.media_type,
        status: "plan_to_watch",
      });

      if (!result.ok) {
        if (result.reason === "unauthenticated") {
          window.location.assign("/auth");
          return;
        }
        alert("ذخیره عنوان انجام نشد: " + result.message);
        return;
      }

      setAddedKeys((current) => new Set(current).add(key));
      setCount((current) => Math.min(ACTIVATION_TARGET, current + 1));
      void trackProductEvent("watchlist_added", {
        source: "onboarding",
        title_type: item.media_type,
        status: "plan_to_watch",
      });
    } finally {
      setAddingId(null);
    }
  };

  const completed = count >= ACTIVATION_TARGET;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-white">
      <div className="mb-8 rounded-2xl border border-gray-800 bg-[#171717] p-6 md:p-8">
        <p className="mb-2 text-sm font-medium text-blue-400">شروع سریع FilmTrack</p>
        <h1 className="text-3xl font-bold md:text-4xl">سه عنوان اضافه کن؛ فیلم‌ترک از همین‌جا برای تو شخصی می‌شود.</h1>
        <p className="mt-4 max-w-2xl leading-7 text-gray-400">
          فیلم یا سریال‌هایی را که می‌خواهی ببینی پیدا کن. برای فعال‌سازی اولیه، حداقل سه عنوان به لیستت اضافه کن.
        </p>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-400">پیشرفت فعال‌سازی</span>
            <span className="font-semibold text-blue-400">{count} / {ACTIVATION_TARGET}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${(count / ACTIVATION_TARGET) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {completed ? (
        <div className="rounded-2xl border border-green-900/60 bg-green-950/20 p-8 text-center">
          <div className="text-4xl">✓</div>
          <h2 className="mt-3 text-2xl font-bold">فعال‌سازی اولیه کامل شد</h2>
          <p className="mt-2 text-gray-400">حالا داشبورد تو دادهٔ کافی برای شروع دارد.</p>
          <Link href="/dashboard" className="mt-6 inline-block">
            <Button className="bg-blue-600 hover:bg-blue-700">رفتن به داشبورد</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="relative mb-6">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="نام فیلم یا سریال را جستجو کن..."
              className="h-14 border-gray-800 bg-[#171717] pr-12 text-base"
              autoFocus
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">در حال جستجو...</div>
          ) : query.trim().length >= 2 && results.length === 0 ? (
            <div className="py-12 text-center text-gray-500">نتیجه‌ای پیدا نشد.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((item) => {
                const key = `${item.media_type}:${item.id}`;
                const alreadyAdded = addedKeys.has(key);
                return (
                  <div key={key} className="flex gap-3 rounded-xl border border-gray-800 bg-[#171717] p-3">
                    <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-800">
                      {item.poster_path ? (
                        <TmdbImage
                          src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                          alt={item.title || item.name || "عنوان"}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <p className="truncate font-semibold">{item.title || item.name}</p>
                        <p className="mt-1 text-xs text-gray-500">{item.media_type === "tv" ? "سریال" : "فیلم"}</p>
                      </div>
                      <Button
                        size="sm"
                        disabled={addingId !== null || alreadyAdded}
                        onClick={() => addTitle(item)}
                        className="self-start bg-blue-600 hover:bg-blue-700"
                      >
                        {alreadyAdded ? "اضافه شد" : addingId === item.id ? "در حال افزودن..." : "افزودن به لیست"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
