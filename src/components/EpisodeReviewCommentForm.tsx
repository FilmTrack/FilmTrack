"use client";

import { useState, useTransition } from "react";

import { addEpisodeReviewComment } from "@/lib/m3/episode-community-client";

export default function EpisodeReviewCommentForm({ reviewId }: { reviewId: string }) {
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!body.trim()) return;
    setMessage("");
    startTransition(async () => {
      const result = await addEpisodeReviewComment(reviewId, body);
      if (result.ok) {
        setBody("");
        setMessage("نظر ثبت شد. برای دیدن آن صفحه را تازه‌سازی کن.");
      } else if (result.code === "disabled") {
        setMessage("گفت‌وگوی اپیزود هنوز برای انتشار نهایی فعال نشده است.");
      } else {
        setMessage("ثبت نظر انجام نشد.");
      }
    });
  };

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={1000}
        rows={2}
        placeholder="پاسخ یا گفت‌وگو درباره همین قسمت..."
        className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white outline-none focus:border-blue-400/40"
      />
      <button
        type="button"
        onClick={submit}
        disabled={pending || !body.trim()}
        className="mt-2 min-h-10 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 text-xs font-black text-blue-200 disabled:opacity-50"
      >
        {pending ? "در حال ثبت..." : "ثبت پاسخ"}
      </button>
      {message ? <p className="mt-2 text-xs text-slate-400" role="status">{message}</p> : null}
    </div>
  );
}
