"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, RotateCcw, Sparkles, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  addDiaryEntry,
  saveRating,
  type RatingDiaryTitleType,
} from "@/lib/m2/rating-diary-client";
import { isRatingDiaryRuntimeEnabled } from "@/lib/m2/readiness";

function faNumber(value: number) {
  return value.toLocaleString("fa-IR");
}

export default function RatingDiaryPanel({
  titleId,
  titleType,
}: {
  titleId: number;
  titleType: RatingDiaryTitleType;
}) {
  const router = useRouter();
  const enabled = isRatingDiaryRuntimeEnabled();
  const [rating, setRating] = useState<number | null>(null);
  const [watchedOn, setWatchedOn] = useState("");
  const [busy, setBusy] = useState<"rating" | "diary" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleResult = (result: Awaited<ReturnType<typeof saveRating>>) => {
    if (result.ok) {
      setMessage("با موفقیت در FilmTrack ذخیره شد.");
      router.refresh();
      return;
    }

    if (result.reason === "unauthenticated") {
      router.push("/auth");
      return;
    }

    if (result.reason === "runtime_unavailable") {
      setMessage("این قابلیت هنوز برای حساب شما فعال نشده است.");
      return;
    }

    setMessage(result.message);
  };

  const submitRating = async () => {
    if (rating === null) return;
    setBusy("rating");
    setMessage(null);

    try {
      handleResult(await saveRating({ titleId, titleType, rating10: rating }));
    } finally {
      setBusy(null);
    }
  };

  const submitDiary = async () => {
    if (!watchedOn) return;
    setBusy("diary");
    setMessage(null);

    try {
      handleResult(await addDiaryEntry({ titleId, titleType, watchedOn }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      aria-label="امتیاز و دفترچه FilmTrack"
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/90 shadow-2xl shadow-black/20 backdrop-blur"
    >
      <div className="border-b border-white/10 bg-gradient-to-l from-violet-500/10 via-blue-500/10 to-transparent px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-blue-300">تجربه شخصی شما</p>
            <h2 className="mt-1 text-lg font-black text-white">امتیاز و دفترچه تماشا</h2>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      {!enabled ? (
        <div className="p-5">
          <div className="rounded-xl border border-blue-400/15 bg-blue-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-blue-500/10 p-2 text-blue-300">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white">زیرساخت آماده است</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  امتیازدهی، ثبت تاریخ تماشا و بازتماشا آماده‌اند و بعد از فعال‌سازی نهایی سرویس در دسترس قرار می‌گیرند.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="p-4 sm:p-5 lg:border-l lg:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">امتیاز من</p>
                <p className="mt-1 text-xs text-slate-500">از ۱ تا ۱۰، دقیق و شخصی</p>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-amber-300" aria-live="polite">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-black">{rating === null ? "—" : faNumber(rating)} از ۱۰</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10 lg:grid-cols-5 xl:grid-cols-10" role="group" aria-label="انتخاب امتیاز از ۱ تا ۱۰">
              {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={rating === value}
                  aria-label={`امتیاز ${faNumber(value)} از ۱۰`}
                  onClick={() => setRating(value)}
                  className={
                    rating === value
                      ? "min-h-11 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 font-black text-white shadow-lg shadow-blue-950/30 outline-none ring-1 ring-white/20"
                      : "min-h-11 rounded-xl border border-white/10 bg-white/[0.03] font-bold text-slate-300 transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  }
                >
                  {faNumber(value)}
                </button>
              ))}
            </div>

            <Button
              type="button"
              onClick={submitRating}
              disabled={rating === null || busy !== null}
              className="mt-4 min-h-12 w-full rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 font-black text-white shadow-lg shadow-blue-950/30 hover:opacity-95"
            >
              {busy === "rating" ? "در حال ذخیره امتیاز..." : "ثبت امتیاز من"}
            </Button>
          </div>

          <div className="border-t border-white/10 p-4 sm:p-5 lg:border-t-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">دفترچه تماشا</p>
                <p className="mt-1 text-xs text-slate-500">هر بار تماشا را جدا ثبت کنید</p>
              </div>
              <div className="flex items-center gap-2 text-slate-400" aria-hidden="true">
                <CalendarDays className="h-4 w-4" />
                <RotateCcw className="h-4 w-4" />
              </div>
            </div>

            <label htmlFor="filmtrack-watched-on" className="mt-4 block text-xs font-bold text-slate-400">
              تاریخ تماشا
            </label>
            <input
              id="filmtrack-watched-on"
              type="date"
              value={watchedOn}
              onChange={(event) => setWatchedOn(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-white outline-none transition [color-scheme:dark] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
            />

            <Button
              type="button"
              variant="outline"
              onClick={submitDiary}
              disabled={!watchedOn || busy !== null}
              className="mt-3 min-h-12 w-full rounded-xl border-white/10 bg-white/[0.03] font-bold text-white hover:bg-white/[0.07]"
            >
              {busy === "diary" ? "در حال ثبت تماشا..." : "ثبت در دفترچه"}
            </Button>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              ثبت دوباره همین عنوان، بازتماشا محسوب می‌شود و تاریخچه شما حفظ خواهد شد.
            </p>
          </div>
        </div>
      )}

      {message && (
        <div className="border-t border-white/10 px-5 py-3 text-sm text-slate-300" role="status">
          {message}
        </div>
      )}
    </section>
  );
}
