"use client";

import { useState, useTransition } from "react";
import { MessageSquareText, ShieldAlert, Star } from "lucide-react";

import { saveEpisodeReview } from "@/lib/m3/episode-community-client";

type Props = {
  titleId: number;
  seasonNumber: number;
  episodeNumber: number;
  initiallyWatched: boolean;
};

export default function EpisodeCommunityComposer({ titleId, seasonNumber, episodeNumber, initiallyWatched }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [containsSpoilers, setContainsSpoilers] = useState(true);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  if (!initiallyWatched) {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm leading-7 text-amber-100">
        <div className="flex items-center gap-2 font-black"><ShieldAlert className="h-4 w-4" /> اول قسمت را دیده‌شده علامت بزن.</div>
        <p className="mt-1 text-amber-100/75">برای جلوگیری از اسپویل تصادفی، امتیاز و نقد اپیزود فقط بعد از ثبت تماشا فعال می‌شود.</p>
      </div>
    );
  }

  const submit = () => {
    setMessage("");
    startTransition(async () => {
      const result = await saveEpisodeReview({
        titleId,
        seasonNumber,
        episodeNumber,
        rating,
        body,
        containsSpoilers,
        visibility: isPublic ? "public" : "private",
      });
      if (result.ok) setMessage("امتیاز و نقد اپیزود ذخیره شد.");
      else if (result.code === "disabled") setMessage("این قابلیت هنوز برای انتشار نهایی فعال نشده است.");
      else if (result.code === "database_error") setMessage("ذخیره انجام نشد. دوباره تلاش کن.");
      else setMessage("برای ثبت نقد، امتیاز یا متن معتبر وارد کن.");
    });
  };

  return (
    <section className="rounded-3xl border border-violet-400/15 bg-violet-500/[0.06] p-5" aria-label="ثبت امتیاز و نقد اپیزود">
      <div className="flex items-center gap-2 text-violet-200">
        <MessageSquareText className="h-5 w-5" />
        <h2 className="font-black">نظر تو درباره این قسمت</h2>
      </div>

      <div className="mt-4">
        <p className="text-xs font-bold text-slate-400">امتیاز از ۱۰</p>
        <div className="mt-2 flex flex-wrap gap-1.5" dir="ltr">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={rating === value
                ? "flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 font-black text-slate-950"
                : "flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-sm font-bold text-slate-300 hover:bg-white/[0.08]"}
              aria-pressed={rating === value}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-bold text-slate-400">نقد کوتاه یا نظر اپیزود</span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={3000}
          rows={5}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-[#07101f] p-3 text-sm leading-7 text-white outline-none focus:border-violet-400/40"
          placeholder="مثلاً ریتم این قسمت فوق‌العاده بود، اما پایان‌بندی..."
        />
      </label>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-300">
          <input type="checkbox" checked={containsSpoilers} onChange={(event) => setContainsSpoilers(event.target.checked)} />
          <ShieldAlert className="h-4 w-4 text-amber-300" /> این نظر اسپویل دارد
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-300">
          <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
          <Star className="h-4 w-4 text-violet-300" /> نمایش در کامیونیتی
        </label>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={submit}
        className="mt-4 min-h-11 rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 px-5 text-sm font-black text-white disabled:opacity-50"
      >
        {pending ? "در حال ذخیره..." : "ثبت امتیاز و نقد"}
      </button>
      {message ? <p className="mt-3 text-xs font-bold text-slate-300" role="status">{message}</p> : null}
    </section>
  );
}
