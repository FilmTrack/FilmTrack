import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

import TmdbImage from "@/components/TmdbImage";
type TMDBResult = {
  id: number;
  poster_path: string | null;
  backdrop_path?: string | null;
  name?: string;
  title?: string;
};

async function fetchTMDB(endpoint: string) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(`https://api.themoviedb.org/3${endpoint}?api_key=${apiKey}&language=en-US`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

const Carousel = ({ title, items, type }: { title: string; items: TMDBResult[]; type: "tv" | "movie" }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-12">
      <h2 className="text-xl font-bold text-white mb-4 pr-1">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {items.slice(0, 20).map((item) => (
          <Link href={`/title/${item.id}?type=${type}`} key={item.id} className="flex-shrink-0 w-32 md:w-40 group">
            <div className="w-full h-48 md:h-60 bg-gray-800 rounded-lg overflow-hidden transition-transform group-hover:scale-105 shadow-lg">
              {item.poster_path && (
                <TmdbImage
                  src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                  alt={item.title || item.name || "Poster"}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <p className="mt-2 text-sm text-gray-400 truncate group-hover:text-white transition-colors">
              {item.title || item.name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default async function Home() {
  const [trendingShows, trendingMovies, popularShows, topRatedShows] = await Promise.all([
    fetchTMDB("/trending/tv/week"),
    fetchTMDB("/trending/movie/week"),
    fetchTMDB("/tv/popular"),
    fetchTMDB("/tv/top_rated"),
  ]);

  // بررسی وضعیت لاگین کاربر
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const genres = [
    { id: 28, name: "اکشن" },
    { id: 35, name: "کمدی" },
    { id: 18, name: "درام" },
    { id: 27, name: "ترسناک" },
    { id: 10765, name: "علمی-تخیلی" },
    { id: 10759, name: "اکشن و ماجراجویی" },
  ];

  return (
    <div className="min-h-screen text-white">

      {/* بخش Hero */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden mb-12">
        {trendingMovies[0] && (
          <div className="absolute inset-0">
            <TmdbImage
              src={`https://image.tmdb.org/t/p/original${trendingMovies[0].backdrop_path || trendingMovies[0].poster_path}`}
              alt="Hero"
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent"></div>
          </div>
        )}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            فیلم‌ها و سریال‌هایت را ردیابی کن
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl">
            به بزرگترین جامعه فارسی‌زبان عاشقان سینما بپیوندید. لیست تماشای خود را بسازید و با دوستانتان به اشتراک بگذارید.
          </p>

          {/* تغییر دکمه بر اساس وضعیت لاگین */}
          {session ? (
            <Link href="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-10 py-6 text-lg rounded-full">
                رفتن به داشبورد
              </Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-10 py-6 text-lg rounded-full">
                شروع رایگان
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* بخش دسته‌بندی‌ها */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <Carousel title="🔥 سریال‌های ترند هفته" items={trendingShows} type="tv" />
        <Carousel title="🎬 فیلم‌های ترند هفته" items={trendingMovies} type="movie" />

        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4 pr-1">کاوش بر اساس ژانر</h2>
          <div className="flex gap-3 flex-wrap">
            {genres.map((genre) => (
              <Link href={`/genre/${genre.id}`} key={genre.id}>
                <Button variant="outline" className="bg-[#1a1a1a] border-gray-800 text-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 rounded-full">
                  {genre.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <Carousel title="⚡ بیشترین بیننده (Binged)" items={popularShows} type="tv" />
        <Carousel title="⭐ بیشترین اضافه‌شده" items={topRatedShows} type="tv" />
      </div>
    </div>
  );
}
