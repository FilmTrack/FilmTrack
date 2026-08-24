"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { trackProductEvent } from "@/lib/product-events";
import { saveWatchStatus, type WatchStatus } from "@/lib/watchlist-client";

const STATUS_OPTIONS: Array<{
  status: WatchStatus;
  label: string;
}> = [
  { status: "plan_to_watch", label: "➕ می‌خواهم ببینم" },
  { status: "watching", label: "📺 در حال تماشا" },
  { status: "completed", label: "✅ تماشا کردم" },
  { status: "on_hold", label: "⏸ فعلاً متوقف" },
  { status: "dropped", label: "⛔ رها کردم" },
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
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {STATUS_OPTIONS.map(({ status, label }) => (
        <Button
          key={status}
          onClick={() => handleAddToList(status)}
          disabled={loading !== null}
          variant={status === "watching" ? "default" : "outline"}
          className={
            status === "watching"
              ? "w-full bg-blue-600 py-6 text-base hover:bg-blue-700"
              : "w-full border-gray-700 py-6 text-base text-gray-200 hover:bg-gray-800"
          }
        >
          {loading === status ? "در حال ذخیره..." : label}
        </Button>
      ))}
    </div>
  );
}
