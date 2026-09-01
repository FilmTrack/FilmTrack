"use client";

import { Loader2, UserCheck, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";

import { setCommunityFollow } from "@/lib/m3/community-follow-client";

type CommunityFollowButtonProps = {
  username: string;
  initialFollowing: boolean;
};

export default function CommunityFollowButton({
  username,
  initialFollowing,
}: CommunityFollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    setMessage(null);
    const nextFollowing = !following;

    startTransition(async () => {
      const result = await setCommunityFollow(username, nextFollowing);
      if (!result.ok) {
        setMessage(
          result.code === "unauthenticated"
            ? "برای دنبال‌کردن اعضا وارد حساب شو."
            : result.code === "disabled"
              ? "بخش اجتماعی FilmTrack هنوز فعال نشده است."
              : "تغییر وضعیت دنبال‌کردن ذخیره نشد. دوباره تلاش کن.",
        );
        return;
      }

      setFollowing(result.following);
    });
  };

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={following}
        className={
          following
            ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-black text-white transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
            : "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
        }
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : following ? (
          <UserCheck className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        {isPending ? "در حال ذخیره…" : following ? "دنبال می‌کنید" : "دنبال کردن"}
      </button>
      {message ? (
        <p className="max-w-xs text-xs leading-5 text-rose-300" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
