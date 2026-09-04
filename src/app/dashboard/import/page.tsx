import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileUp, ShieldCheck } from "lucide-react";

import ImportFileUpload from "@/components/imports/ImportFileUpload";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "انتقال تاریخچه | FilmTrack",
  description: "انتقال امن تاریخچه تماشا از TV Time، Letterboxd و Trakt به FilmTrack با پیش‌نمایش بدون ذخیره‌سازی.",
  robots: { index: false, follow: false },
};

export default async function ImportDashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect("/auth");

  return (
    <main className="min-h-screen bg-[#050914] text-white" dir="rtl">
      <section className="border-b border-white/5 bg-[radial-gradient(circle_at_75%_0%,rgba(37,99,235,.15),transparent_32%),radial-gradient(circle_at_20%_0%,rgba(124,58,237,.12),transparent_28%)]">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white">
            <ArrowRight className="h-4 w-4" /> بازگشت به داشبورد
          </Link>

          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-200">
                <FileUp className="h-4 w-4" /> Migration Center
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">تاریخچه‌ات را با خودت بیاور</h1>
              <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-400 sm:text-base">
                فایل خروجی TV Time، Letterboxd یا Trakt را انتخاب کن. FilmTrack ابتدا فقط فایل را تحلیل و نتیجه را پیش‌نمایش می‌کند؛ در این مرحله هیچ داده‌ای در حساب تو ذخیره نمی‌شود.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.06] p-4 text-sm leading-7 text-slate-300">
              <div className="flex items-center gap-2 font-black text-emerald-200"><ShieldCheck className="h-4 w-4" /> پیش‌نمایش بدون نوشتن</div>
              <p className="mt-2 text-xs text-slate-400">فقط رکوردهای دارای هویت قطعی در گروه قابل‌انتقال قرار می‌گیرند؛ موارد مبهم یا حل‌نشده مسدود می‌مانند.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <ImportFileUpload />
      </div>
    </main>
  );
}
