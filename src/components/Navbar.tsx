import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import LogoutButton from "./LogoutButton";
import LiveSearch from "./LiveSearch";
import Logo from "./Logo";
import {
  Calendar,
  ChevronDown,
  Compass,
  Film,
  History,
  Home,
  ListVideo,
  Menu,
  Sparkles,
  Tv,
  Upload,
  UserRound,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const desktopLinkClass =
  "inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(claimsData?.claims?.sub);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#050914]/90 shadow-[0_12px_40px_rgba(0,0,0,.18)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 lg:gap-5">
            <Logo />

            <nav aria-label="ناوبری اصلی" className="hidden items-center gap-0.5 md:flex">
              <Link href="/" className={desktopLinkClass}>
                <Home className="h-4 w-4" /> خانه
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className={desktopLinkClass}>
                  <Tv className="h-4 w-4" /> سریال‌ها <ChevronDown className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="border-white/10 bg-[#0b1220]/98 text-white shadow-2xl backdrop-blur-xl">
                  <Link href="/shows" className="block cursor-pointer">
                    <DropdownMenuItem>سریال‌های محبوب</DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className={desktopLinkClass}>
                  <Film className="h-4 w-4" /> فیلم‌ها <ChevronDown className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="border-white/10 bg-[#0b1220]/98 text-white shadow-2xl backdrop-blur-xl">
                  <Link href="/movies" className="block cursor-pointer">
                    <DropdownMenuItem>فیلم‌های محبوب</DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className={desktopLinkClass}>
                  <ListVideo className="h-4 w-4" /> ژانرها <ChevronDown className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52 border-white/10 bg-[#0b1220]/98 text-white shadow-2xl backdrop-blur-xl">
                  <Link href="/genres" className="block cursor-pointer"><DropdownMenuItem>تمام ژانرها</DropdownMenuItem></Link>
                  <div className="grid grid-cols-2 gap-1 p-2">
                    <Link href="/genre/28" className="block cursor-pointer"><DropdownMenuItem>اکشن</DropdownMenuItem></Link>
                    <Link href="/genre/35" className="block cursor-pointer"><DropdownMenuItem>کمدی</DropdownMenuItem></Link>
                    <Link href="/genre/18" className="block cursor-pointer"><DropdownMenuItem>درام</DropdownMenuItem></Link>
                    <Link href="/genre/27" className="block cursor-pointer"><DropdownMenuItem>ترسناک</DropdownMenuItem></Link>
                    <Link href="/genre/878" className="block cursor-pointer"><DropdownMenuItem>علمی‌تخیلی</DropdownMenuItem></Link>
                    <Link href="/genre/53" className="block cursor-pointer"><DropdownMenuItem>هیجان‌انگیز</DropdownMenuItem></Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/discover" className={`${desktopLinkClass} text-violet-300 hover:text-violet-200`}>
                <Compass className="h-4 w-4" /> کشف فارسی
              </Link>

              <Link href="/calendar" className={desktopLinkClass}>
                <Calendar className="h-4 w-4" /> تقویم
              </Link>

              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className={`${desktopLinkClass} text-violet-300 hover:text-violet-200`}>
                    <Sparkles className="h-4 w-4" /> برای من <ChevronDown className="h-3.5 w-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 border-white/10 bg-[#0b1220]/98 text-white shadow-2xl backdrop-blur-xl">
                    <Link href="/dashboard/recommendations" className="block cursor-pointer"><DropdownMenuItem><Sparkles className="ml-2 h-4 w-4" /> چی ببینم؟</DropdownMenuItem></Link>
                    <Link href="/dashboard/history" className="block cursor-pointer"><DropdownMenuItem><History className="ml-2 h-4 w-4" /> تاریخچه و امتیازها</DropdownMenuItem></Link>
                    <Link href="/dashboard/import" className="block cursor-pointer"><DropdownMenuItem><Upload className="ml-2 h-4 w-4" /> انتقال از سرویس‌های دیگر</DropdownMenuItem></Link>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}

              <Link href="/plus" className={`${desktopLinkClass} text-blue-300 hover:text-blue-200`}>
                <Sparkles className="h-4 w-4" /> پلاس
              </Link>
            </nav>
          </div>

          <div className="hidden min-w-0 flex-1 justify-center lg:flex">
            <div className="w-full max-w-[330px]">
              <LiveSearch />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm font-bold text-slate-300 transition hover:bg-white/[0.07] hover:text-white sm:inline-flex"
                >
                  <UserRound className="h-4 w-4" /> پنل من
                </Link>
                <LogoutButton />
              </>
            ) : (
              <Link href="/auth">
                <Button className="h-10 rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 px-4 font-black text-white shadow-lg shadow-blue-950/20 hover:opacity-95">
                  ورود
                </Button>
              </Link>
            )}

            <details className="relative md:hidden">
              <summary
                aria-label="باز کردن منوی FilmTrack"
                className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-200 transition hover:bg-white/[0.08] [&::-webkit-details-marker]:hidden"
              >
                <Menu className="h-5 w-5" />
              </summary>
              <nav className="fixed inset-x-3 top-[72px] z-50 max-h-[calc(100vh-88px)] overflow-y-auto rounded-2xl border border-white/10 bg-[#09111f]/98 p-2 text-sm text-slate-200 shadow-2xl backdrop-blur-xl sm:left-4 sm:right-auto sm:min-w-72">
                <Link href="/" className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 font-bold hover:bg-white/[0.06]"><Home className="h-4 w-4 text-blue-300" /> خانه</Link>
                <Link href="/movies" className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 font-bold hover:bg-white/[0.06]"><Film className="h-4 w-4 text-blue-300" /> فیلم‌ها</Link>
                <Link href="/shows" className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 font-bold hover:bg-white/[0.06]"><Tv className="h-4 w-4 text-blue-300" /> سریال‌ها</Link>
                <Link href="/genres" className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 font-bold hover:bg-white/[0.06]"><ListVideo className="h-4 w-4 text-blue-300" /> ژانرها</Link>
                <Link href="/discover" className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 font-black text-violet-200 hover:bg-violet-500/10"><Compass className="h-4 w-4" /> کشف فارسی</Link>
                <Link href="/calendar" className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 font-bold hover:bg-white/[0.06]"><Calendar className="h-4 w-4 text-blue-300" /> تقویم پخش</Link>
                {isLoggedIn ? (
                  <>
                    <div className="my-1 border-t border-white/10" />
                    <Link href="/dashboard/recommendations" className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 font-black text-violet-200 hover:bg-violet-500/10"><Sparkles className="h-4 w-4" /> چی ببینم؟</Link>
                    <Link href="/dashboard/history" className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 font-bold hover:bg-white/[0.06]"><History className="h-4 w-4 text-amber-300" /> تاریخچه و امتیازها</Link>
                    <Link href="/dashboard/import" className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 font-bold hover:bg-white/[0.06]"><Upload className="h-4 w-4 text-emerald-300" /> انتقال تاریخچه</Link>
                  </>
                ) : null}
                <Link href="/plus" className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 font-black text-blue-300 hover:bg-blue-500/10"><Sparkles className="h-4 w-4" /> FilmTrack Plus</Link>
                {isLoggedIn && (
                  <Link href="/dashboard" className="mt-1 flex min-h-12 items-center gap-3 border-t border-white/10 px-3 py-2 font-bold hover:bg-white/[0.06]"><UserRound className="h-4 w-4" /> پنل من</Link>
                )}
              </nav>
            </details>
          </div>
        </div>

        <div className="pb-3 lg:hidden">
          <LiveSearch />
        </div>
      </div>
    </header>
  );
}
