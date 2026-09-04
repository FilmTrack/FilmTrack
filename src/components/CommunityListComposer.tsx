"use client";

import { useState } from "react";
import { createCommunityList } from "@/lib/m3/community-content-client";

export default function CommunityListComposer() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMessage("");
    const result = await createCommunityList({ name, slug, description, visibility });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.code === "invalid" ? "نام یا آدرس فهرست معتبر نیست." : result.code === "disabled" ? "بخش فهرست‌های اجتماعی هنوز فعال نشده است." : "ساخت فهرست انجام نشد.");
      return;
    }
    setName("");
    setSlug("");
    setDescription("");
    setMessage("فهرست ساخته شد؛ صفحه را تازه کن تا نمایش داده شود.");
  }

  return (
    <div className="rounded-3xl border border-violet-400/15 bg-violet-500/[0.05] p-5" dir="rtl">
      <h2 className="text-lg font-black text-white">فهرست جدید</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="نام فهرست" className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none" />
        <input dir="ltr" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} maxLength={48} placeholder="my-favorites" className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none" />
      </div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} placeholder="توضیح کوتاه (اختیاری)" className="mt-3 w-full rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white outline-none" />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="text-xs text-slate-300">نمایش <select value={visibility} onChange={(e) => setVisibility(e.target.value as "private" | "public")} className="mr-2 rounded-lg bg-[#0b1220] px-2 py-1"><option value="private">خصوصی</option><option value="public">عمومی</option></select></label>
        <button onClick={submit} disabled={busy || !name.trim() || slug.length < 3} className="min-h-10 rounded-xl bg-violet-600 px-4 text-xs font-black text-white disabled:opacity-40">{busy ? "در حال ساخت…" : "ساخت فهرست"}</button>
      </div>
      {message ? <p className="mt-3 text-xs text-slate-400">{message}</p> : null}
    </div>
  );
}
