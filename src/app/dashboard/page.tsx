import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import ListVisibilityToggle from "@/components/ListVisibilityToggle";
import TmdbImage from "@/components/TmdbImage";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    redirect("/auth");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: userLists } = await supabase
    .from("user_lists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const apiKey = process.env.TMDB_API_KEY;

  const fetchTMDBDetails = async (id: number, type: string) => {
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

  const watchList = userLists || [];
  const tmdbResults = await Promise.all(
    watchList.map((item) => fetchTMDBDetails(item.title_id, item.title_type)),
  );

  const combinedList = watchList
    .map((item, index) => ({ db: item, tmdb: tmdbResults[index] }))
    .filter((item) => item.tmdb !== null);

  const stats = [
    { label: "مجموع آیتم‌ها", value: watchList.length.toString(), icon: "🎬" },
    {
      label: "در حال تماشا",
      value: watchList.filter((i) => i.status === "watching").length.toString(),
      icon: "📺",
    },
    {
      label: "تماشا شده",
      value: watchList.filter((i) => i.status === "completed").length.toString(),
      icon: "✅",
    },
    {
      label: "عمومی",
      value: watchList.filter((i) => i.is_public === true).length.toString(),
      icon: "🌐",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row gap-8">
        <main className="flex-1 space-y-12">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold border-r-4 border-blue-600 pr-3">
                لیست تماشای شما
              </h2>
              <p className="text-sm text-gray-500 mt-3">
                همه آیتم‌ها به‌صورت پیش‌فرض خصوصی هستند. فقط مواردی که خودتان روی «عمومی» قرار دهید در پروفایل عمومی دیده می‌شوند.
              </p>
            </div>

            {combinedList.length === 0 ? (
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-8 text-center">
                <p className="text-gray-400 mb-4">هنوز هیچ چیزی به لیست خود اضافه نکرده‌اید!</p>
                <Link href="/">
                  <Button className="bg-blue-600 hover:bg-blue-700">کاوش و افزودن فیلم</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {combinedList.map(({ db, tmdb }) => (
                  <div
                    key={db.id}
                    className="flex flex-col sm:flex-row gap-4 bg-[#1a1a1a] border border-gray-800 p-4 rounded-xl hover:border-gray-600 transition-colors"
                  >
                    <Link
                      href={`/title/${db.title_id}?type=${db.title_type}`}
                      className="flex flex-1 flex-col sm:flex-row gap-4 min-w-0"
                    >
                      <div className="w-full sm:w-24 h-36 sm:h-36 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                        {tmdb.poster_path && (
                          <TmdbImage
                            src={`https://image.tmdb.org/t/p/w500${tmdb.poster_path}`}
                            alt={tmdb.title || tmdb.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold truncate">{tmdb.title || tmdb.name}</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {db.title_type === "tv" ? "سریال" : "فیلم"} - {tmdb.release_date
                            ? new Date(tmdb.release_date).getFullYear()
                            : tmdb.first_air_date
                              ? new Date(tmdb.first_air_date).getFullYear()
                              : ""}
                        </p>
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-600/20 text-blue-500 text-xs rounded-md">
                          {db.status === "watching"
                            ? "📺 در حال تماشا"
                            : db.status === "completed"
                              ? "✅ تماشا شده"
                              : "⏳ در صف انتظار"}
                        </span>
                      </div>
                    </Link>

                    <div className="flex sm:flex-col gap-2 sm:items-end sm:justify-between">
                      <ListVisibilityToggle id={db.id} initialPublic={db.is_public === true} />
                      <Link href={`/title/${db.title_id}?type=${db.title_type}`}>
                        <Button size="sm" className="bg-gray-800 hover:bg-gray-700 text-white">
                          مشاهده و بروزرسانی
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        <aside className="w-full md:w-80 flex-shrink-0">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 sticky top-24">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-800">
              <Avatar className="w-16 h-16 border-2 border-blue-600">
                <AvatarFallback className="bg-gray-800 text-2xl text-blue-500">
                  {user?.email?.[0]?.toUpperCase() || "F"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-gray-400 text-sm">خوش آمدید،</p>
                <h3 className="font-bold text-lg truncate">{user?.email || "FilmTrack"}</h3>
              </div>
            </div>

            <h4 className="text-sm text-gray-500 mb-4 font-semibold">آمار شما</h4>
            <div className="space-y-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex justify-between items-center bg-gray-900 p-3 rounded-lg">
                  <span className="text-gray-300 text-sm flex items-center gap-2">
                    <span>{stat.icon}</span> {stat.label}
                  </span>
                  <span className="font-bold text-blue-500">{stat.value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Link href={`/profile/${userId}`} className="block">
                <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700">
                  🌐 مشاهده پروفایل عمومی
                </Button>
              </Link>
              <Link href="/calendar" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  📅 تقویم پخش سریال‌ها
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700">
                  کاوش در فیلم‌ها
                </Button>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
