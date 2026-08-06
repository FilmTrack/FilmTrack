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

  // Debounce: صبر می‌کند تا کاربر تایپ کردن را متوقف کند
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
    }, 300) // 300 میلی‌ثانیه تاخیر

    return () => {
      clearTimeout(delayDebounceFn)
      controller.abort()
    }
  }, [query])

  // بستن منو با کلیک خارج از آن
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
    <div ref={searchRef} className="relative w-64 lg:w-72">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      <Input 
        placeholder="جستجوی فیلم یا سریال..." 
        className="bg-[#1a1a1a] border-gray-800 text-white placeholder:text-gray-500 pr-10 focus-visible:ring-blue-600"
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
          if (e.key === 'Enter' && query.trim()) {
            router.push(`/search?q=${query}`)
            setShowResults(false)
          }
        }}
      />

      {/* منوی کشویی نتایج */}
      {showResults && query.trim().length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-2xl overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400 text-sm">در حال جستجو...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">نتیجه‌ای یافت نشد.</div>
          ) : (
            <ul className="max-h-[400px] overflow-y-auto">
              {results.map((item) => (
                <Link 
                  href={`/title/${item.id}?type=${item.media_type}`} 
                  key={item.id}
                  onClick={() => {
                    setShowResults(false)
                    setQuery("")
                  }}
                >
                  <li className="flex items-center gap-3 p-2 hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className="w-10 h-14 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                      {item.poster_path && (
                        <TmdbImage src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt={item.title || item.name || "Search result"} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.title || item.name}</p>
                      <p className="text-gray-500 text-xs">{item.media_type === 'tv' ? 'سریال' : 'فیلم'}</p>
                    </div>
                  </li>
                </Link>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}