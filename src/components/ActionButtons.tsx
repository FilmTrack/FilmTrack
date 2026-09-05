"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus, Check, CirclePause, Eye, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trackProductEvent } from "@/lib/product-events";
import { saveWatchStatus, type WatchStatus } from "@/lib/watchlist-client";

const STATUS_OPTIONS: Array<{
  status: WatchStatus;
  label: string;
  icon: typeof Eye;
}> = [
  { status: "plan_to_watch", label: "می‌خواهم ببینم", icon: BookmarkPlus },
  { status: "watching", label: "در حال تماشا", icon: Eye },
  { status: "completed", label: "تماشا کردم", icon: Check },
  { status: "on_hold", label: "فعلاً متوقف", icon: CirclePause },
  { status: "dropped", label: "رها کردم", icon: X },
];

export default function ActionButtons({
  titleId,
  type,
}: {
  titleId: string;
  type: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<WatchStatus | null>(null);

  const titleType = type === "tv" ? "tv" : "movie";

  const handleAddToList = async (status: WatchStatus) => {
    setLoading(status);

    try {
      const result = await saveWatchStatus({
        titleId: Number(titleId),
        titleType,
        status,
      });

      if (!result.ok && result.reason === "unauthenticated") {
        router.push("/auth");
        return;
      }

      if (!result.ok) {
        alert("خطا در ذخیره اطلاعات: " + result.message);
        return;
      }

      void trackProductEvent("watchlist_added", {
        source: "title_detail",
        title_type: titleType,
        status,
      });

      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {STATUS_OPTIONS.map(({ status, label, icon: Icon }) => (
        <Button
          key={status}
          onClick={() => handleAddToList(status)}
          disabled={loading !== null}
          variant={status === "watching" ? "default" : "outline"}
          className={
            status === "watching"
              ? "min-h-11 w-full justify-start gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-500"
              : "min-h-11 w-full justify-start gap-2 rounded-xl border-white/10 bg-white/[0.03] px-4 text-sm font-bold text-slate-200 hover:border-blue-400/30 hover:bg-white/[0.07] hover:text-white"
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{loading === status ? "در حال ذخیره..." : label}</span>
        </Button>
      ))}
    </div>
  );
}
