import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AccountPrivacyActions from "@/components/AccountPrivacyActions";
import { isAccountDeleteRuntimeEnabled } from "@/lib/account/readiness";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "حساب و حریم خصوصی | FilmTrack",
  robots: { index: false, follow: false },
};

export default async function AccountPrivacyPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/auth");

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-[#050914] px-4 py-10 text-white" dir="rtl">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-blue-300">Account & Privacy Center</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">حساب و حریم خصوصی</h1>
            <p className="mt-3 max-w-2xl text-sm leading-8 text-slate-400">
              داده‌های شخصی FilmTrack را دریافت کن، وضعیت حساب را ببین و کنترل حذف دائمی حساب را از یک محل مدیریت کن.
            </p>
          </div>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 text-sm font-bold text-slate-200">
            بازگشت به داشبورد
          </Link>
        </div>

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="text-xs font-bold text-slate-500">حساب فعال</p>
          <p dir="ltr" className="mt-2 break-all text-sm font-black text-white">{user?.email ?? "FilmTrack account"}</p>
          <p className="mt-3 text-xs leading-6 text-slate-500">
            خروجی داده‌ها فقط با session همین حساب و تحت RLS خوانده می‌شود؛ هیچ service-role credential به مرورگر ارسال نمی‌شود.
          </p>
        </section>

        <AccountPrivacyActions deleteEnabled={isAccountDeleteRuntimeEnabled()} />
      </div>
    </main>
  );
}
