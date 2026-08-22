import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

import TmdbImage from "@/components/TmdbImage";

export default async function PublicProfile({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const apiKey = process.env.TMDB_API_KEY;

  const { data: userLists } = await supabase
    .from("user_lists")
    .select("*")
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  const watchList = userLists || [];

  const fetchTMDB = async (id: number, type: string) => {
    if (!apiKey) return null;
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=en-US`,
        { next: { revalidate: 3600 } },
      );
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  };

  const tmdbResults = await Promise.all(
    watchList.map((item) => fetchTMDB(item.title_id, item.title_type)),
  );
  const combinedList = watchList
    .map((item, index) => ({ db: item, tmdb: tmdbResults[index] }))
    .filter((item) => item.tmdb);

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-3 border-r-4 border-blue-600 pr-3">
          لیست تماشای عمومی
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          فقط عنوان‌هایی نمایش داده می‌شوند که صاحب حساب صریحاً عمومی کرده است.
        </p>

        {combinedList.length === 0 ? (
          <p className="text-gray-400">این کاربر فعلاً عنوان عمومی‌ای ندارد.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {combinedList.map(({ db, tmdb }) => (
              <Link
                href={`/title/${db.title_id}?type=${db.title_type}`}
                key={db.id}
                className="group"
              >
                <div className="w-full aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden transition-transform group-hover:scale-105">
                  {tmdb.poster_path && (
                    <TmdbImage
                      src={`https://image.tmdb.org/t/p/w500${tmdb.poster_path}`}
                      alt={tmdb.title || tmdb.name || "Poster"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-400 truncate group-hover:text-white">
                  {tmdb.title || tmdb.name}
                </p>
                <span className="text-xs text-blue-500">
                  {db.status === "watching" ? "در حال تماشا" : "تماشا شده"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
