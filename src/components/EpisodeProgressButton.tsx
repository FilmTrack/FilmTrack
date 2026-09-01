"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Props = {
  titleId: number;
  seasonNumber: number;
  episodeNumber: number;
  initiallyWatched?: boolean;
};

export default function EpisodeProgressButton({
  titleId,
  seasonNumber,
  episodeNumber,
  initiallyWatched = false,
}: Props) {
  const [watched, setWatched] = useState(initiallyWatched);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleWatched() {
    if (pending) return;

    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("برای ثبت پیشرفت تماشا وارد حساب شو.");
        return;
      }

      if (watched) {
        const { error: deleteError } = await supabase
          .from("episode_progress")
          .delete()
          .eq("user_id", user.id)
          .eq("title_id", titleId)
          .eq("season_number", seasonNumber)
          .eq("episode_number", episodeNumber);

        if (deleteError) throw deleteError;
        setWatched(false);
      } else {
        const { error: upsertError } = await supabase
          .from("episode_progress")
          .upsert(
            {
              user_id: user.id,
              title_id: titleId,
              season_number: seasonNumber,
              episode_number: episodeNumber,
              watched_at: new Date().toISOString(),
            },
            { onConflict: "user_id,title_id,season_number,episode_number" },
          );

        if (upsertError) throw upsertError;
        setWatched(true);
      }
    } catch {
      setError("ثبت وضعیت انجام نشد؛ دوباره تلاش کن.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant={watched ? "outline" : "default"}
        disabled={pending}
        onClick={toggleWatched}
        className={watched
          ? "min-h-10 rounded-xl border-emerald-400/20 bg-emerald-500/10 font-bold text-emerald-300 hover:bg-emerald-500/15"
          : "min-h-10 rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 font-bold text-white"}
      >
        {pending ? (
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="ml-2 h-4 w-4" />
        )}
        {watched ? "دیده شده · لغو" : "این قسمت را دیدم"}
      </Button>
      {error && <p className="text-xs font-medium text-rose-300">{error}</p>}
    </div>
  );
}
