"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  addDiaryEntry,
  saveRating,
  type RatingDiaryTitleType,
} from "@/lib/m2/rating-diary-client";
import { isRatingDiaryRuntimeEnabled } from "@/lib/m2/readiness";

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

  if (!enabled) {
    return (
      <section
        aria-label="امتیاز و دفترچه FilmTrack"
        className="mt-4 rounded-xl border border-gray-800 bg-[#151515] p-4"
      >
        <p className="font-semibold text-white">امتیاز و دفترچه FilmTrack</p>
        <p className="mt-1 text-sm leading-6 text-gray-400">
          زیرساخت این قابلیت آماده است و پس از تأیید نهایی پایگاه‌داده فعال می‌شود.
        </p>
      </section>
    );
  }

  const handleResult = (result: Awaited<ReturnType<typeof saveRating>>) => {
    if (result.ok) {
      setMessage("ذخیره شد.");
      router.refresh();
      return;
    }

    if (result.reason === "unauthenticated") {
      router.push("/auth");
      return;
    }

    if (result.reason === "runtime_unavailable") {
      setMessage("این قابلیت هنوز فعال نشده است.");
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
      className="mt-4 space-y-4 rounded-xl border border-gray-800 bg-[#151515] p-4"
    >
      <div>
        <p className="font-semibold text-white">امتیاز من</p>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={rating === value}
              onClick={() => setRating(value)}
              className={
                rating === value
                  ? "min-h-11 rounded-lg bg-blue-600 font-bold text-white"
                  : "min-h-11 rounded-lg border border-gray-700 bg-[#101010] text-gray-300 hover:border-gray-500"
              }
            >
              {value}
            </button>
          ))}
        </div>
        <Button
          type="button"
          onClick={submitRating}
          disabled={rating === null || busy !== null}
          className="mt-3 min-h-11 w-full"
        >
          {busy === "rating" ? "در حال ذخیره..." : "ثبت امتیاز"}
        </Button>
      </div>

      <div className="border-t border-gray-800 pt-4">
        <label htmlFor="filmtrack-watched-on" className="font-semibold text-white">
          ثبت در دفترچه تماشا
        </label>
        <input
          id="filmtrack-watched-on"
          type="date"
          value={watchedOn}
          onChange={(event) => setWatchedOn(event.target.value)}
          className="mt-3 min-h-11 w-full rounded-lg border border-gray-700 bg-[#101010] px-3 text-white"
        />
        <Button
          type="button"
          variant="outline"
          onClick={submitDiary}
          disabled={!watchedOn || busy !== null}
          className="mt-3 min-h-11 w-full border-gray-700"
        >
          {busy === "diary" ? "در حال ثبت..." : "ثبت تماشا"}
        </Button>
        <p className="mt-2 text-xs leading-5 text-gray-500">
          ثبت دوباره همین عنوان، تماشای مجدد را بدون حذف تاریخچه حفظ می‌کند.
        </p>
      </div>

      {message && <p className="text-sm text-gray-300">{message}</p>}
    </section>
  );
}
