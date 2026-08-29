import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import LogoutButton from "./LogoutButton";
import LiveSearch from "./LiveSearch";
import Logo from "./Logo";
import {
  Calendar,
  ChevronDown,
  Film,
  ListVideo,
  Menu,
  Sparkles,
  Tv,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(claimsData?.claims?.sub);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-[#0e0e0e]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 md:flex-nowrap md:gap-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Logo />

          <nav className="hidden items-center gap-4 text-sm font-medium text-gray-400 md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 transition-colors hover:text-white">
                <Tv className="h-4 w-4" /> سریال‌ها <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-gray-800 bg-[#1a1a1a] text-white">
                <Link href="/shows" className="block cursor-pointer"><DropdownMenuItem>سریال‌های محبوب TMDB</DropdownMenuItem></Link>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 transition-colors hover:text-white">
                <Film className="h-4 w-4" /> فیلم‌ها <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-gray-800 bg-[#1a1a1a] text-white">
                <Link href="/movies" className="block cursor-pointer"><DropdownMenuItem>فیلم‌های محبوب TMDB</DropdownMenuItem></Link>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 transition-colors hover:text-white">
                <ListVideo className="h-4 w-4" /> ژانرها <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 border-gray-800 bg-[#1a1a1a] text-white">
                <Link href="/genres" className="block cursor-pointer"><DropdownMenuItem>تمام ژانرها</DropdownMenuItem></Link>
                <div className="grid grid-cols-2 gap-1 p-2">
                  <Link href="/genre/28" className="block cursor-pointer"><DropdownMenuItem>اکشن</DropdownMenuItem></Link>
                  <Link href="/genre/35" className="block cursor-pointer"><DropdownMenuItem>کمدی</DropdownMenuItem></Link>
                  <Link href="/genre/18" className="block cursor-pointer"><DropdownMenuItem>درام</DropdownMenuItem></Link>
                  <Link href="/genre/27" className="block cursor-pointer"><DropdownMenuItem>ترسناک</DropdownMenuItem></Link>
                  <Link href="/genre/878" className="block cursor-pointer"><DropdownMenuItem>علمی-تخیلی</DropdownMenuItem></Link>
                  <Link href="/genre/53" className="block cursor-pointer"><DropdownMenuItem>هیجان‌انگیز</DropdownMenuItem></Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/calendar" className="flex items-center gap-1 transition-colors hover:text-white">
              <Calendar className="h-4 w-4" /> تقویم
            </Link>

            <Link href="/plus" className="flex items-center gap-1 text-blue-300 transition-colors hover:text-blue-200">
              <Sparkles className="h-4 w-4" /> Plus
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:order-3 md:gap-3">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" className="hidden text-gray-300 hover:bg-gray-800 hover:text-white md:inline-flex">
                  پنل کاربری
                </Button>
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/auth"><Button className="h-10 bg-blue-600 px-4 hover:bg-blue-700">ورود</Button></Link>
          )}

          <details className="relative md:hidden">
            <summary
              aria-label="باز کردن منوی FilmTrack"
              className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md border border-gray-800 text-gray-200 transition-colors hover:bg-gray-800 [&::-webkit-details-marker]:hidden"
            >
              <Menu className="h-5 w-5" />
            </summary>
            <nav className="absolute left-0 top-12 z-50 min-w-56 overflow-hidden rounded-xl border border-gray-800 bg-[#161616] p-2 text-sm text-gray-200 shadow-2xl">
              <Link href="/movies" className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-800"><Film className="h-4 w-4" /> فیلم‌ها</Link>
              <Link href="/shows" className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-800"><Tv className="h-4 w-4" /> سریال‌ها</Link>
              <Link href="/genres" className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-800"><ListVideo className="h-4 w-4" /> ژانرها</Link>
              <Link href="/calendar" className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-800"><Calendar className="h-4 w-4" /> تقویم</Link>
              <Link href="/plus" className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-blue-300 hover:bg-gray-800"><Sparkles className="h-4 w-4" /> FilmTrack Plus</Link>
              {isLoggedIn && (
                <Link href="/dashboard" className="mt-1 flex min-h-11 items-center rounded-lg border-t border-gray-800 px-3 py-2 hover:bg-gray-800">پنل کاربری</Link>
              )}
            </nav>
          </details>
        </div>

        <div className="order-3 w-full md:order-2 md:w-auto md:flex-1 md:max-w-72">
          <LiveSearch />
        </div>
      </div>
    </header>
  );
}
