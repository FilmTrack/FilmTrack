"use client";

import Link from "next/link";
import { Loader2, Sparkles, UserCheck, UserPlus, UsersRound } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import {
  getCommunityRelationship,
  setCommunityFollow,
} from "@/lib/m3/community-follow-client";

type CommunityFollowButtonProps = {
  username: string;
  initialFollowing: boolean;
  compact?: boolean;
};

export default function CommunityFollowButton({
  username,
  initialFollowing,
  compact = false,
}: CommunityFollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followsYou, setFollowsYou] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    void getCommunityRelationship(username).then((result) => {
      if (!cancelled && result.ok) {
        setFollowing(result.following);
        setFollowsYou(result.followsYou);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [username]);

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
    <div className={`flex flex-col items-stretch gap-2 ${compact ? "" : "sm:items-end"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          aria-pressed={following}
          className={
            following
              ? `inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm font-black text-white transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-60 ${compact ? "min-h-10 px-3" : "min-h-11 px-5"}`
              : `inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60 ${compact ? "min-h-10 px-3" : "min-h-11 px-5"}`
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

        <Link
          href={`/u/${encodeURIComponent(username)}/taste`}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 font-black text-violet-100 transition hover:bg-violet-500/15 ${compact ? "min-h-10 px-3 text-xs" : "min-h-11 px-4 text-sm"}`}
        >
          <Sparkles className="h-4 w-4" /> Taste Match
        </Link>
      </div>

      {followsYou ? (
        <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
          <UsersRound className="h-3.5 w-3.5" /> این عضو هم شما را دنبال می‌کند
        </p>
      ) : null}

      {message ? (
        <p className="max-w-xs text-xs leading-5 text-rose-300" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
