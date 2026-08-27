import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-900 bg-[#0e0e0e]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 text-sm text-gray-400 sm:grid-cols-2 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="sm:col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-4 max-w-sm text-xs leading-6">
            خانه فارسی‌زبان علاقه‌مندان فیلم و سریال؛ عنوان‌هایت را کشف کن، مسیر تماشایت را ثبت کن و تاریخچه شخصی خودت را بساز.
          </p>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-white">کاوش کنید</h3>
          <ul className="space-y-2">
            <li><Link href="/shows" className="transition-colors hover:text-blue-400">سریال‌های محبوب</Link></li>
            <li><Link href="/movies" className="transition-colors hover:text-blue-400">فیلم‌های محبوب</Link></li>
            <li><Link href="/genres" className="transition-colors hover:text-blue-400">ژانرها</Link></li>
            <li><Link href="/calendar" className="transition-colors hover:text-blue-400">تقویم پخش</Link></li>
            <li><Link href="/plus" className="transition-colors hover:text-blue-400">FilmTrack Plus</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-white">FilmTrack</h3>
          <ul className="space-y-2">
            <li><Link href="/about" className="transition-colors hover:text-blue-400">درباره FilmTrack</Link></li>
            <li><Link href="/privacy" className="transition-colors hover:text-blue-400">حریم خصوصی</Link></li>
            <li><Link href="/terms" className="transition-colors hover:text-blue-400">قوانین و مقررات</Link></li>
            <li><a href="https://github.com/FilmTrack/FilmTrack" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-blue-400">گیت‌هاب FilmTrack</a></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-white">ارتباط</h3>
          <ul className="space-y-2">
            <li><a href="https://amirmotefaker.ir" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-blue-400">امیر متفکر</a></li>
            <li><a href="https://t.me/amirmotefaker" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-blue-400">تلگرام</a></li>
            <li><a href="https://www.linkedin.com/in/amirmotefaker/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-blue-400">لینکدین</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-900 px-4 py-6 text-center text-xs leading-6 text-gray-500">
        درست شده با عشق ❤️ برای ایرانیان توسط{" "}
        <a
          href="https://amirmotefaker.ir"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-400 transition-colors hover:text-blue-300 hover:underline"
        >
          امیر متفکر
        </a>
      </div>
    </footer>
  );
}
