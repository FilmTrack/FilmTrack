import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import LogoutButton from "./LogoutButton";
import LiveSearch from "./LiveSearch";
import Logo from "./Logo"; // اضافه شدن لوگوی جدید
import { ChevronDown, Film, ListVideo, Tv, Calendar } from "lucide-react";
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
    <header className="w-full border-b border-gray-800 bg-[#0e0e0e]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between p-4 gap-4 md:gap-8">
        
        {/* راست: لوگوی جدید و منوها */}
        <div className="flex items-center gap-6">
          <Logo /> {/* استفاده از لوگوی جدید */}
          
          <nav className="hidden md:flex items-center gap-4 text-gray-400 text-sm font-medium">
            
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-white transition-colors">
                <Tv className="w-4 h-4" /> سریال‌ها <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1a1a1a] border-gray-800 text-white">
                <Link href="/shows" className="cursor-pointer block"><DropdownMenuItem>سریال‌های محبوب TMDB</DropdownMenuItem></Link>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-white transition-colors">
                <Film className="w-4 h-4" /> فیلم‌ها <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1a1a1a] border-gray-800 text-white">
                <Link href="/movies" className="cursor-pointer block"><DropdownMenuItem>فیلم‌های محبوب TMDB</DropdownMenuItem></Link>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-white transition-colors">
                <ListVideo className="w-4 h-4" /> ژانرها <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1a1a1a] border-gray-800 text-white w-48">
                <Link href="/genres" className="cursor-pointer block"><DropdownMenuItem>تمام ژانرها</DropdownMenuItem></Link>
                <div className="grid grid-cols-2 gap-1 p-2">
                  <Link href="/genre/28" className="cursor-pointer block"><DropdownMenuItem>اکشن</DropdownMenuItem></Link>
                  <Link href="/genre/35" className="cursor-pointer block"><DropdownMenuItem>کمدی</DropdownMenuItem></Link>
                  <Link href="/genre/18" className="cursor-pointer block"><DropdownMenuItem>درام</DropdownMenuItem></Link>
                  <Link href="/genre/27" className="cursor-pointer block"><DropdownMenuItem>ترسناک</DropdownMenuItem></Link>
                  <Link href="/genre/878" className="cursor-pointer block"><DropdownMenuItem>علمی-تخیلی</DropdownMenuItem></Link>
                  <Link href="/genre/53" className="cursor-pointer block"><DropdownMenuItem>هیجان‌انگیز</DropdownMenuItem></Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/calendar" className="flex items-center gap-1 hover:text-white transition-colors">
              <Calendar className="w-4 h-4" /> تقویم
            </Link>

          </nav>
        </div>

        <div className="flex items-center gap-4">
          <LiveSearch />
          {isLoggedIn ? (
            <>
              <Link href="/dashboard"><Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800 hidden md:block">پنل کاربری</Button></Link>
              <LogoutButton />
            </>
          ) : (
            <Link href="/auth"><Button className="bg-blue-600 hover:bg-blue-700">ورود</Button></Link>
          )}
        </div>
      </div>
    </header>
  );
}
