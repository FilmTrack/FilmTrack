"use client";

import { useState } from "react";
import { saveCommunityReview } from "@/lib/m3/community-content-client";

export default function CommunityReviewComposer({ titleId, titleType }: { titleId: number; titleType: "movie" | "tv" }) {
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [spoilers, setSpoilers] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMessage("");
    const result = await saveCommunityReview({ titleId, titleType, body, containsSpoilers: spoilers, visibility });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.code === "disabled" ? "بخش نقدهای اجتماعی هنوز فعال نشده است." : "ذخیره نقد انجام نشد.");
      return;
    }
    setMessage("نقد ذخیره شد.");
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5" dir="rtl">
      <h2 className="text-lg font-black text-white">نقد من</h2>
      <p className="mt-2 text-xs leading-6 text-slate-500">نقدها به‌صورت پیش‌فرض خصوصی هستند؛ انتشار عمومی فقط با انتخاب خودت انجام می‌شود.</p>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} rows={6} placeholder="نظرت درباره این عنوان چیست؟" className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none focus:border-violet-400/40" />
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-300">
        <label className="flex items-center gap-2"><input type="checkbox" checked={spoilers} onChange={(e) => setSpoilers(e.target.checked)} /> شامل اسپویل</label>
        <label className="flex items-center gap-2">نمایش <select value={visibility} onChange={(e) => setVisibility(e.target.value as "private" | "public")} className="rounded-lg bg-[#0b1220] px-2 py-1"><option value="private">خصوصی</option><option value="public">عمومی</option></select></label>
      </div>
      <button disabled={busy || body.trim().length === 0} onClick={submit} className="mt-4 min-h-11 rounded-xl bg-violet-600 px-5 text-sm font-black text-white disabled:opacity-40">{busy ? "در حال ذخیره…" : "ذخیره نقد"}</button>
      {message ? <p className="mt-3 text-xs text-slate-400">{message}</p> : null}
    </section>
  );
}
