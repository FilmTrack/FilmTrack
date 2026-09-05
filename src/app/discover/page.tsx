import type { Metadata } from "next";
import Link from "next/link";
import { Film, ListVideo, Search, Sparkles, Tv } from "lucide-react";

import TmdbImage from "@/components/TmdbImage";
import { Button } from "@/components/ui/button";
import { buildTmdbDiscoverPath, parsePersianDiscoveryIntent } from "@/lib/m4/discovery";

export const metadata: Metadata = {
  title: "چی ببینم؟ جستجوی فارسی بر اساس حال‌وهوا | FilmTrack",
  description:
    "با زبان طبیعی فارسی بگو چه فیلم یا سریالی می‌خواهی و FilmTrack فیلترهای قابل‌فهم و شفاف برای کشف عنوان‌ها می‌سازد.",
  alternates: { canonical: "/discover" },
};

type SearchParams = Promise<{ q?: string }>;
type TmdbItem = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

async function fetchDiscovery(path: string) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [] as TmdbItem[];

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3${path}&api_key=${apiKey}&language=fa-IR&page=1`,
      { next: { revalidate: 1800 } },
    );
    if (!response.ok) return [] as TmdbItem[];
    const payload = (await response.json()) as { results?: TmdbItem[] };
    return (payload.results || []).slice(0, 24);
  } catch {
    return [] as TmdbItem[];
  }
}

export default async function DiscoverPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const intent = query ? parsePersianDiscoveryIntent(query) : null;
  const hasLiveCatalog = Boolean(process.env.TMDB_API_KEY);
  const results = intent ? await fetchDiscovery(buildTmdbDiscoverPath(intent)) : [];

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_80%_0%,rgba(124,58,237,.16),transparent_30%),radial-gradient(circle_at_20%_0%,rgba(37,99,235,.12),transparent_28%)]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-black text-violet-200">
            <Sparkles className="h-4 w-4" /> کشف فارسی FilmTrack
          </div>
          <h1 className="mt-4 text-3xl font-black sm:text-5xl">چی ببینم؟</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-400 sm:text-base">
            مثل یک آدم بنویس چه می‌خواهی؛ FilmTrack عبارتت را به فیلترهای شفاف تبدیل می‌کند. این نسخه rule-based است و ادعای «هوش مصنوعی» ساختگی ندارد.
          </p>

          <form action="/discover" className="mt-7 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="discover-q" className="sr-only">توضیح چیزی که می‌خواهی ببینی</label>
            <input
              id="discover-q"
              name="q"
              defaultValue={query}
              placeholder="مثلاً: یه سریال کوتاه معمایی برای آخر شب"
              className="min-h-12 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none ring-0 placeholder:text-slate-600 focus:border-violet-400/40"
            />
            <Button type="submit" className="min-h-12 rounded-2xl bg-gradient-to-l from-violet-600 to-blue-500 px-6 font-black text-white">
              <Search className="ml-2 h-4 w-4" /> پیدا کن
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {["یه فیلم غمگین ولی امیدبخش", "یه سریال کوتاه معمایی", "یه کمدی سبک جدید", "یه فیلم علمی‌تخیلی کلاسیک", "بهترین فیلم جنایی"].map((sample) => (
              <Link key={sample} href={`/discover?q=${encodeURIComponent(sample)}`} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300 hover:bg-white/[0.07] hover:text-white">
                {sample}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {!intent ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="text-lg font-black">جمله‌ات را بنویس</p>
            <p className="mt-2 text-sm leading-7 text-slate-500">نوع محتوا، ژانر، حال‌وهوا، کوتاه/بلند بودن یا جدید/کلاسیک بودن را می‌توانی آزادانه در جمله بیاوری.</p>
          </div>
        ) : (
          <>
            <div className="mb-7 rounded-3xl border border-blue-400/15 bg-blue-500/[0.06] p-5">
              <p className="text-xs font-black text-blue-300">برداشت FilmTrack از درخواست تو</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {intent.explanation.map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-slate-200">{item}</span>
                ))}
              </div>
              <p className="mt-3 text-xs leading-6 text-slate-500">اگر برداشت مناسب نیست، جمله را تغییر بده؛ این نسخه به‌صورت شفاف و deterministic کار می‌کند.</p>
            </div>

            {results.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-center sm:p-9">
                <Sparkles className="mx-auto h-7 w-7 text-violet-300" />
                <p className="mt-4 text-base font-black text-white">
                  {hasLiveCatalog ? "برای این ترکیب نتیجه کافی پیدا نشد" : "داده‌های زنده‌ی کاتالوگ در این Preview فعال نیست"}
                </p>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                  {hasLiveCatalog
                    ? "یکی از محدودیت‌ها را ساده‌تر کن یا با یک جمله کوتاه‌تر دوباره امتحان کن."
                    : "موتور فهم درخواست فارسی فعال است، اما این محیط Preview عمداً بدون کلید TMDB اجرا می‌شود تا هیچ Secret تولیدی در محیط تست قرار نگیرد."}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Link href="/movies" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-slate-200 hover:bg-white/[0.08]"><Film className="h-4 w-4 text-blue-300" /> فیلم‌ها</Link>
                  <Link href="/shows" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-slate-200 hover:bg-white/[0.08]"><Tv className="h-4 w-4 text-violet-300" /> سریال‌ها</Link>
                  <Link href="/genres" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-slate-200 hover:bg-white/[0.08]"><ListVideo className="h-4 w-4 text-emerald-300" /> ژانرها</Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {results.map((item) => {
                  const title = item.title || item.name || `عنوان #${item.id}`;
                  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
                  return (
                    <Link key={item.id} href={`/title/${item.id}?type=${intent.mediaType}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/80 transition hover:border-violet-400/30">
                      <div className="aspect-[2/3] bg-white/[0.04]">
                        {item.poster_path ? <TmdbImage src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={`پوستر ${title}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : null}
                      </div>
                      <div className="p-3">
                        <h2 className="line-clamp-2 text-sm font-black">{title}</h2>
                        <p className="mt-2 text-[11px] text-slate-500">{intent.mediaType === "tv" ? "سریال" : "فیلم"}{year ? ` · ${year}` : ""}</p>
                        {typeof item.vote_average === "number" ? <p className="mt-2 text-[11px] text-slate-500">TMDB {item.vote_average.toFixed(1)}</p> : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
