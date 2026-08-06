import Link from "next/link";

import TmdbImage from "@/components/TmdbImage";
const genres = [
  { id: 28, name: "اکشن" },
  { id: 35, name: "کمدی" },
  { id: 18, name: "درام" },
  { id: 27, name: "ترسناک" },
  { id: 878, name: "علمی-تخیلی" },
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
  try {
    const res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genreId}&sort_by=popularity.desc&page=1`);
    const data = await res.json();
    return data.results?.[0] || null;
  } catch {
    return null;
  }
}

export default async function GenresPage() {
  // گرفتن محبوب‌ترین فیلم برای هر ژانر به صورت همزمان
  const topMovies = await Promise.all(genres.map(g => fetchTopMovie(g.id)));

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 border-r-4 border-blue-600 pr-3">کاوش بر اساس ژانر</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {genres.map((genre, index) => {
            const movie = topMovies[index];
            return (
              <Link href={`/genre/${genre.id}`} key={genre.id} className="group relative h-40 rounded-xl overflow-hidden border border-gray-800">
                {movie?.backdrop_path ? (
                  <TmdbImage
                    src={`https://image.tmdb.org/t/p/w500${movie.backdrop_path}`}
                    alt={genre.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 group-hover:scale-110 transition-all duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-800"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent"></div>
                <div className="relative h-full flex items-center justify-center p-4">
                  <h3 className="text-xl md:text-2xl font-extrabold text-white text-center group-hover:text-blue-500 transition-colors">
                    {genre.name}
                  </h3>
                </div>
              </Link>
            )
          })}
        </div>

      </div>
    </div>
  );
}
