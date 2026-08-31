import Link from "next/link";
import { Compass, Sparkles } from "lucide-react";

import TmdbImage from "@/components/TmdbImage";

const genres = [
  { id: 28, name: "اکشن" },
  { id: 35, name: "کمدی" },
  { id: 18, name: "درام" },
  { id: 27, name: "ترسناک" },
  { id: 878, name: "علمی‌تخیلی" },
  { id: 53, name: "هیجان‌انگیز" },
  { id: 10749, name: "عاشقانه" },
  { id: 80, name: "جنایی" },
  { id: 16, name: "انیمیشن" },
  { id: 14, name: "فانتزی" },
  { id: 12, name: "ماجراجویی" },
  { id: 9648, name: "معمایی" },
];

async function fetchTopMovie(genreId: number) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL("https://api.themoviedb.org/3/discover/movie");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("language", "fa-IR");
    url.searchParams.set("with_genres", String(genreId));
    url.searchParams.set("sort_by", "popularity.desc");
    url.searchParams.set("page", "1");

    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0] || null;
  } catch {
    return null;
  }
}

export default async function GenresPage() {
  const topMovies = await Promise.all(genres.map((genre) => fetchTopMovie(genre.id)));

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_78%_0%,rgba(37,99,235,.14),transparent_30%),radial-gradient(circle_at_22%_0%,rgba(124,58,237,.12),transparent_28%)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-200">
            <Compass className="h-4 w-4" /> انتخاب بر اساس حال‌وهوا
          </div>
          <h1 className="mt-5 text-3xl font-black sm:text-4xl lg:text-5xl">از ژانر مورد علاقه‌ات شروع کن</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            وقتی نمی‌دانی چه ببینی، ژانر بهترین نقطه شروع است. یک حال‌وهوا انتخاب کن و مستقیم وارد دنیای همان عنوان‌ها شو.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {genres.map((genre, index) => {
            const movie = topMovies[index];
            return (
              <Link
                href={`/genre/${genre.id}`}
                key={genre.id}
                className="group relative min-h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-lg shadow-black/20 sm:min-h-48"
              >
                {movie?.backdrop_path ? (
                  <TmdbImage
                    src={`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`}
                    alt={`تصویر ژانر ${genre.name}`}
                    className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-500 group-hover:scale-[1.04] group-hover:opacity-55"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(37,99,235,.18),transparent_35%),radial-gradient(circle_at_30%_80%,rgba(124,58,237,.15),transparent_40%)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050914] via-[#050914]/55 to-transparent" />
                <div className="relative flex h-full min-h-40 flex-col justify-end p-4 sm:min-h-48 sm:p-5">
                  <Sparkles className="h-4 w-4 text-blue-300" />
                  <h2 className="mt-2 text-lg font-black text-white sm:text-xl">{genre.name}</h2>
                  <p className="mt-1 text-xs text-slate-400">مشاهده عنوان‌های این ژانر</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
