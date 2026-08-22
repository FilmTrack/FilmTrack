import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Check,
  HeartHandshake,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "FilmTrack Plus",
  description:
    "FilmTrack Plus لایهٔ اختیاری امکانات پیشرفته است؛ هستهٔ ردیابی فیلم و سریال رایگان و کاربردی باقی می‌ماند.",
};

const plusFeatures = [
  {
    icon: BarChart3,
    title: "آمار پیشرفتهٔ تماشا",
    description: "تحلیل عادت‌های تماشا، روندها و گزارش‌های شخصی عمیق‌تر.",
  },
  {
    icon: SlidersHorizontal,
    title: "کنترل بیشتر روی پیشنهادها",
    description: "تنظیم دقیق‌تر سلیقه و سیگنال‌هایی که در پیشنهادهای شخصی استفاده می‌شوند.",
  },
  {
    icon: Palette,
    title: "شخصی‌سازی حرفه‌ای",
    description: "گزینه‌های بیشتر برای فهرست‌ها، پروفایل و نحوهٔ نمایش هویت سینمایی شما.",
  },
  {
    icon: Sparkles,
    title: "قابلیت‌های آزمایشی Plus",
    description: "دسترسی زودتر به ابزارهای پیشرفته‌ای که ارزش واقعی آن‌ها با دادهٔ استفاده سنجیده شده است.",
  },
];

const freeCore = [
  "ثبت و مدیریت فیلم‌ها و سریال‌های در حال تماشا",
  "پیگیری پیشرفت و ادامهٔ مسیر تماشا",
  "کشف عنوان‌ها و جست‌وجوی فارسی",
  "هستهٔ تقویم و تجربهٔ اصلی FilmTrack",
];

const principles = [
  "هستهٔ ردیابی برای کاربران رایگان کاربردی می‌ماند.",
  "FilmTrack دادهٔ شخصی کاربران را برای تبلیغات یا فروش پروفایل نمی‌فروشد.",
  "اسپانسرینگ فقط با برچسب شفاف و بدون دست‌کاری پنهانی رتبه‌بندی انجام می‌شود.",
  "همکاری‌های معرفی سرویس تماشا فقط برای مقصدهای قانونی و با افشای رابطهٔ تجاری انجام می‌شود.",
];

export default function PlusPage() {
  return (
    <div className="min-h-screen text-white">
      <section className="border-b border-gray-900 bg-gradient-to-b from-blue-950/30 via-[#0e0e0e] to-[#0e0e0e]">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <Sparkles className="h-4 w-4" />
              FilmTrack Plus — در حال آماده‌سازی
            </div>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              برای طرفدارهای حرفه‌ای؛ بدون خراب‌کردن تجربهٔ رایگان
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-400 md:text-lg">
              Plus یک لایهٔ اختیاری برای امکانات پیشرفته است. مسیر اصلی کشف، ثبت و
              پیگیری فیلم و سریال قرار نیست پشت Paywall برود.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/auth">
                <Button size="lg" className="rounded-full bg-blue-600 px-8 hover:bg-blue-700">
                  ساخت حساب رایگان
                </Button>
              </Link>
              <Link href="#principles">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-gray-700 bg-transparent text-gray-200 hover:bg-gray-900 hover:text-white"
                >
                  اصول درآمدزایی
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-800 bg-[#151515] p-7 md:p-9">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-400">FilmTrack</p>
                <h2 className="mt-1 text-2xl font-black">رایگان</h2>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                هستهٔ اصلی
              </span>
            </div>
            <p className="mb-7 leading-7 text-gray-400">
              تجربه‌ای که برای Tracking لازم است باید حتی بدون اشتراک هم ارزشمند بماند.
            </p>
            <ul className="space-y-4">
              {freeCore.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-gray-200">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-blue-500/30 bg-blue-500/[0.07] p-7 shadow-2xl shadow-blue-950/20 md:p-9">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-300">FilmTrack Plus</p>
                <h2 className="mt-1 text-2xl font-black">اختیاری و پیشرفته</h2>
              </div>
              <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-200">
                پایلوت آینده
              </span>
            </div>
            <p className="mb-7 leading-7 text-gray-300">
              قیمت‌گذاری و فروش فقط بعد از اثبات Retention و آماده‌شدن الزامات حریم خصوصی فعال می‌شود.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {plusFeatures.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-2xl border border-blue-400/10 bg-black/20 p-4">
                  <Icon className="mb-3 h-5 w-5 text-blue-300" />
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="principles" className="border-y border-gray-900 bg-[#111111]">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-black">درآمد پایدار، بدون معامله روی اعتماد</h2>
              <p className="mt-4 leading-8 text-gray-400">
                FilmTrack می‌تواند از اشتراک Plus، اسپانسرینگ شفاف، معرفی قانونی مقصدهای تماشا
                و در آینده بینش‌های تجمیعیِ privacy-safe درآمد داشته باشد؛ نه از فروش اطلاعات شخصی.
              </p>
            </div>

            <div className="space-y-3">
              {principles.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-gray-800 bg-[#171717] p-4 text-sm leading-7 text-gray-200">
                  <HeartHandshake className="mt-1 h-5 w-5 shrink-0 text-blue-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center md:px-8">
        <p className="text-sm font-bold text-amber-300">وضعیت فعلی</p>
        <h2 className="mt-3 text-3xl font-black">Checkout هنوز فعال نیست</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-8 text-gray-400">
          قبل از فروش Plus باید چهار هفته روند WAT پایدار یا رو به رشد، baseline قابل اتکای D30
          و مسیرهای Export/Delete و حریم خصوصی آماده باشند. تا آن زمان تمرکز FilmTrack روی ساختن
          محصولی است که کاربران واقعاً بخواهند به آن برگردند.
        </p>
      </section>
    </div>
  );
}
