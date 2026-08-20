import Link from "next/link";
import Logo from "./Logo"; // استفاده از لوگوی جدید

export default function Footer() {
  return (
    <footer className="bg-[#0e0e0e] border-t border-gray-900 mt-20">
      <div className="max-w-7xl mx-auto p-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-gray-400 text-sm">
        
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="text-xs leading-6 mt-4">خانه فارسی‌زبان علاقه‌مندان فیلم و سریال؛ عنوان‌هایت را کشف و مسیر تماشایت را ثبت کن.</p>
        </div>

        <div>
          <h3 className="text-white font-bold mb-4">کاوش کنید</h3>
          <ul className="space-y-2">
            <li><Link href="/shows" className="hover:text-blue-500">سریال‌های محبوب</Link></li>
            <li><Link href="/movies" className="hover:text-blue-500">فیلم‌های محبوب</Link></li>
            <li><Link href="/genres" className="hover:text-blue-500">ژانرها</Link></li>
            <li><Link href="/calendar" className="hover:text-blue-500">تقویم پخش</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-bold mb-4">جامعه</h3>
          <ul className="space-y-2">
            <li><Link href="/terms" className="hover:text-blue-500">قوانین و مقررات</Link></li>
            <li><Link href="/privacy" className="hover:text-blue-500">حریم خصوصی</Link></li>
            <li><Link href="/about" className="hover:text-blue-500">درباره ما</Link></li>
            <li><a href="https://t.me/amirmotefaker" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">تماس با ما</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-bold mb-4">ما را دنبال کنید</h3>
          <ul className="space-y-2">
            <li><a href="https://amirmotefaker.ir/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">وب‌سایت شخصی</a></li>
            <li><a href="https://t.me/amirmotefaker" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">تلگرام</a></li>
            <li><a href="https://github.com/AmirMotefaker" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">گیت‌هاب</a></li>
            <li><a href="https://www.instagram.com/amirmotefaker.ir" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">اینستاگرام</a></li>
            <li><a href="https://www.linkedin.com/in/amirmotefaker/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">لینکدین</a></li>
          </ul>
        </div>

      </div>
      
      {/* کپی رایت اختصاصی شما */}
      <div className="border-t border-gray-900 py-6 text-center text-xs text-gray-600">
        درست شده با عشق ❤️ برای ایرانیان توسط <a href="https://github.com/AmirMotefaker" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">امیر متفکر</a> | FilmTrack
      </div>
    </footer>
  );
}
