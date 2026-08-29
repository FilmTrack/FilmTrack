"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import TmdbImage from "@/components/TmdbImage"

type SearchResult = {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type: string;
}

export default function LiveSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 2) return undefined

    const controller = new AbortController()
    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true)

      try {
        const searchParams = new URLSearchParams({ q: normalizedQuery })
        const res = await fetch(`/api/search?${searchParams}`, {
          signal: controller.signal,
        })

        if (!res.ok) {
          throw new Error(`Search failed with status ${res.status}`)
        }

        const data = (await res.json()) as SearchResult[]
        setResults(data)
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, 300)

    return () => {
      clearTimeout(delayDebounceFn)
      controller.abort()
    }
  }, [query])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={searchRef} className="relative w-full md:w-64 lg:w-72">
      <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <Input
        aria-label="جستجوی فیلم یا سریال"
        placeholder="جستجوی فیلم یا سریال..."
        className="h-11 bg-[#1a1a1a] pr-10 text-white placeholder:text-gray-500 focus-visible:ring-blue-600"
        value={query}
        onChange={(e) => {
          const nextQuery = e.target.value
          setQuery(nextQuery)
          setShowResults(true)

          if (nextQuery.trim().length < 2) {
            setResults([])
            setIsLoading(false)
          }
        }}
        onFocus={() => setShowResults(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`)
            setShowResults(false)
          }
        }}
      />

      {showResults && query.trim().length >= 2 && (
        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-lg border border-gray-800 bg-[#1a1a1a] shadow-2xl">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-400">در حال جستجو...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">نتیجه‌ای یافت نشد.</div>
          ) : (
            <ul className="max-h-[min(60vh,400px)] overflow-y-auto">
              {results.map((item) => (
                <li key={`${item.media_type}:${item.id}`}>
                  <Link
                    href={`/title/${item.id}?type=${item.media_type}`}
                    className="flex min-h-16 items-center gap-3 p-2 transition-colors hover:bg-gray-800 focus-visible:bg-gray-800 focus-visible:outline-none"
                    onClick={() => {
                      setShowResults(false)
                      setQuery("")
                    }}
                  >
                    <div className="h-14 w-10 flex-shrink-0 overflow-hidden rounded bg-gray-700">
                      {item.poster_path && (
                        <TmdbImage
                          src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                          alt={item.title || item.name || "Search result"}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{item.title || item.name}</p>
                      <p className="text-xs text-gray-500">{item.media_type === "tv" ? "سریال" : "فیلم"}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
