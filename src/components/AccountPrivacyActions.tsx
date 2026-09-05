"use client";

import { useState } from "react";
import { Download, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deleteMyFilmTrackAccount,
  exportMyFilmTrackData,
} from "@/lib/account/account-privacy-client";

const DELETE_CONFIRMATION = "حذف حساب من";

export default function AccountPrivacyActions({ deleteEnabled }: { deleteEnabled: boolean }) {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setMessage(null);
    const result = await exportMyFilmTrackData();
    setExporting(false);

    if (!result.ok) {
      setMessage("خروجی داده‌ها آماده نشد. دوباره تلاش کن.");
      return;
    }

    const blob = new Blob([JSON.stringify(result.payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `filmtrack-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage("خروجی داده‌های حساب آماده و دانلود شد.");
  }

  async function handleDelete() {
    if (confirmation !== DELETE_CONFIRMATION || !deleteEnabled) return;
    setDeleting(true);
    setMessage(null);
    const result = await deleteMyFilmTrackAccount();
    setDeleting(false);

    if (!result.ok) {
      setMessage(
        result.code === "disabled"
          ? "حذف حساب هنوز برای نسخه اصلی فعال نشده است."
          : "حذف حساب انجام نشد. هیچ داده‌ای عمداً حذف نشد.",
      );
      return;
    }

    window.location.assign("/?account=deleted");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-blue-400/15 bg-blue-500/[0.06] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3">
            <Download className="h-5 w-5 text-blue-200" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black">دریافت نسخه داده‌های من</h2>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              یک فایل قابل‌حمل از فهرست‌ها، امتیازها، دفترچه تماشا، پیشرفت قسمت‌ها و داده‌های اجتماعی متعلق به حساب خودت دریافت می‌کنی.
            </p>
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="mt-4 min-h-11 rounded-xl bg-blue-600 px-5 font-black text-white hover:bg-blue-500"
            >
              {exporting ? "در حال آماده‌سازی..." : "دانلود داده‌های من"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-red-400/20 bg-red-500/[0.06] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3">
            <ShieldAlert className="h-5 w-5 text-red-200" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black">حذف دائمی حساب</h2>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              این عملیات برگشت‌پذیر نیست و پس از تأیید نهایی پایگاه‌داده، حساب و داده‌های متعلق به آن را حذف می‌کند. قبل از حذف می‌توانی خروجی داده‌ها را دریافت کنی.
            </p>

            {!deleteEnabled ? (
              <div className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-500/[0.06] p-4 text-sm leading-7 text-amber-100">
                حذف حساب هنوز عمداً غیرفعال است تا تغییر ساختاری مربوط به نسخه اصلی جداگانه بررسی و تأیید شود.
              </div>
            ) : (
              <>
                <label className="mt-4 block text-sm font-bold text-slate-300" htmlFor="delete-confirmation">
                  برای تأیید دقیقاً بنویس: <span className="text-red-300">{DELETE_CONFIRMATION}</span>
                </label>
                <input
                  id="delete-confirmation"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-red-400/40"
                  autoComplete="off"
                />
                <Button
                  onClick={handleDelete}
                  disabled={deleting || confirmation !== DELETE_CONFIRMATION}
                  className="mt-4 min-h-11 rounded-xl bg-red-600 px-5 font-black text-white hover:bg-red-500 disabled:opacity-40"
                >
                  <Trash2 className="ml-2 h-4 w-4" />
                  {deleting ? "در حال حذف..." : "حذف دائمی حساب"}
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {message ? (
        <p role="status" className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
          {message}
        </p>
      ) : null}
    </div>
  );
}
