import Link from "next/link";
import { Play, TimerReset } from "lucide-react";

import { Button } from "@/components/ui/button";

export type ContinueWatchingItem = {
  titleId: number;
  name: string;
  seasonNumber: number;
  episodeNumber: number;
  progressPercent: number;
  href: string;
};

export default function ContinueWatchingPanel({ items }: { items: ContinueWatchingItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center gap-2 text-sm font-black text-white">
          <TimerReset className="h-4 w-4 text-blue-300" /> ادامه تماشا
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-500">وقتی تماشای یک سریال را شروع کنی، قسمت بعدی از همین‌جا آماده ادامه خواهد بود.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">ادامه تماشا</h2>
          <p className="mt-1 text-xs text-slate-500">سریع برگرد به قسمت بعدی سریال‌هایت.</p>
        </div>
        <Play className="h-5 w-5 text-blue-300" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <article key={`${item.titleId}:${item.seasonNumber}:${item.episodeNumber}`} className="rounded-2xl border border-white/10 bg-[#0b1220]/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-black text-white">{item.name}</p>
                <p className="mt-1 text-xs text-slate-500">فصل {item.seasonNumber} · قسمت {item.episodeNumber}</p>
              </div>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-black text-blue-300">{item.progressPercent}%</span>
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-l from-violet-500 to-blue-500" style={{ width: `${Math.min(100, Math.max(0, item.progressPercent))}%` }} />
            </div>

            <Link href={item.href} className="mt-4 inline-flex w-full">
              <Button className="min-h-10 w-full rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 font-bold text-white">ادامه تماشا</Button>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
