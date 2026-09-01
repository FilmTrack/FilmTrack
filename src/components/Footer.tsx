import Link from "next/link";
import { ArrowUpLeft, Code2, Sparkles } from "lucide-react";
import Logo from "./Logo";

const footerLinkClass =
  "inline-flex min-h-10 items-center text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#050914] text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(37,99,235,.10),rgba(124,58,237,.06),rgba(255,255,255,.015))] p-5 sm:p-7">
          <div className="grid gap-8 md:grid-cols-[1.3fr_.7fr_.7fr]">
            <div>
              <Logo />
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
                خانه فارسی طرفداران فیلم و سریال؛ برای کشف عنوان‌های تازه، ساخت فهرست شخصی، امتیازدهی و نگهداری دفترچه تماشا.
              </p>
              <Link
                href="/plus"
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 text-sm font-black text-blue-200 transition hover:bg-blue-500/15"
              >
                <Sparkles className="h-4 w-4" /> آشنایی با FilmTrack Plus
              </Link>
            </div>

            <div>
              <h2 className="text-sm font-black text-white">کاوش</h2>
              <nav className="mt-3 grid text-sm">
                <Link href="/movies" className={footerLinkClass}>فیلم‌ها</Link>
                <Link href="/shows" className={footerLinkClass}>سریال‌ها</Link>
                <Link href="/genres" className={footerLinkClass}>ژانرها</Link>
                <Link href="/calendar" className={footerLinkClass}>تقویم پخش</Link>
              </nav>
            </div>

            <div>
              <h2 className="text-sm font-black text-white">FilmTrack</h2>
              <nav className="mt-3 grid text-sm">
                <Link href="/about" className={footerLinkClass}>درباره ما</Link>
                <Link href="/privacy" className={footerLinkClass}>حریم خصوصی</Link>
                <Link href="/terms" className={footerLinkClass}>قوانین و مقررات</Link>
                <a href="https://github.com/FilmTrack/FilmTrack" target="_blank" rel="noopener noreferrer" className={`${footerLinkClass} gap-2`}>
                  <Code2 className="h-4 w-4" /> گیت‌هاب
                </a>
              </nav>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-1 pt-6 text-xs leading-6 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© FilmTrack — تجربه شخصی فیلم و سریال برای فارسی‌زبان‌ها</p>
          <a
            href="https://amirmotefaker.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-1.5 font-bold text-slate-400 transition hover:text-blue-300"
          >
            ساخته‌شده توسط امیر متفکر <ArrowUpLeft className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
