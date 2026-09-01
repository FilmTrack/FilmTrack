"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  COMMUNITY_BIO_MAX_LENGTH,
  COMMUNITY_DISPLAY_NAME_MAX_LENGTH,
  COMMUNITY_USERNAME_MAX_LENGTH,
  type CommunityProfileVisibility,
} from "@/lib/community-identity";
import { saveCommunityProfile } from "@/lib/m3/community-profile-client";
import { isCommunityRuntimeEnabled } from "@/lib/m3/readiness";

export default function CommunityProfileEditor({
  initialUsername = "",
  initialDisplayName = "",
  initialBio = "",
  initialVisibility = "private",
}: {
  initialUsername?: string;
  initialDisplayName?: string;
  initialBio?: string | null;
  initialVisibility?: CommunityProfileVisibility;
}) {
  const router = useRouter();
  const enabled = isCommunityRuntimeEnabled();
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio ?? "");
  const [visibility, setVisibility] = useState<CommunityProfileVisibility>(initialVisibility);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    if (pending || !enabled) return;

    setPending(true);
    setMessage(null);

    try {
      const result = await saveCommunityProfile({
        username,
        displayName,
        bio,
        visibility,
      });

      if (result.ok) {
        setMessage("پروفایل با موفقیت ذخیره شد.");
        router.refresh();
        return;
      }

      if (result.reason === "unauthenticated") {
        router.push("/auth");
        return;
      }

      setMessage(result.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1220]/90 shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 bg-gradient-to-l from-violet-500/10 via-blue-500/10 to-transparent p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-300">هویت طرفداری شما</p>
            <h2 className="mt-1 text-xl font-black text-white">پروفایل FilmTrack</h2>
          </div>
        </div>
      </div>

      {!enabled ? (
        <div className="p-5 sm:p-6">
          <div className="flex gap-3 rounded-2xl border border-blue-400/15 bg-blue-500/5 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
            <div>
              <p className="font-bold text-white">زیرساخت پروفایل آماده است</p>
              <p className="mt-1 text-sm leading-7 text-slate-400">
                فعال‌سازی پروفایل اجتماعی بعد از تأیید نهایی پایگاه‌داده انجام می‌شود. تا آن زمان هیچ اطلاعات پروفایلی ذخیره نمی‌شود.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 p-5 sm:p-6">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-200">نام کاربری</span>
            <input
              dir="ltr"
              value={username}
              maxLength={COMMUNITY_USERNAME_MAX_LENGTH}
              autoComplete="username"
              onChange={(event) => setUsername(event.target.value.toLowerCase())}
              placeholder="filmfan_1405"
              className="min-h-12 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-left text-white outline-none transition focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/10"
            />
            <span className="text-xs leading-5 text-slate-500">۳ تا ۲۴ نویسه؛ حروف انگلیسی کوچک، عدد یا زیرخط.</span>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-200">نام نمایشی</span>
            <input
              value={displayName}
              maxLength={COMMUNITY_DISPLAY_NAME_MAX_LENGTH}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="نامی که طرفداران می‌بینند"
              className="min-h-12 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/10"
            />
          </label>

          <label className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-slate-200">درباره من</span>
              <span className="text-xs text-slate-500">{bio.length}/{COMMUNITY_BIO_MAX_LENGTH}</span>
            </div>
            <textarea
              value={bio}
              maxLength={COMMUNITY_BIO_MAX_LENGTH}
              onChange={(event) => setBio(event.target.value)}
              placeholder="مثلاً عاشق سینمای علمی‌تخیلی و سریال‌های جنایی"
              rows={4}
              className="resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 leading-7 text-white outline-none transition focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/10"
            />
          </label>

          <div className="grid gap-2">
            <span className="text-sm font-bold text-slate-200">حریم خصوصی پروفایل</span>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.025] p-2">
              <button
                type="button"
                onClick={() => setVisibility("private")}
                aria-pressed={visibility === "private"}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${visibility === "private" ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
              >
                <EyeOff className="h-4 w-4" />
                خصوصی
              </button>
              <button
                type="button"
                onClick={() => setVisibility("public")}
                aria-pressed={visibility === "public"}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${visibility === "public" ? "bg-gradient-to-l from-violet-600/80 to-blue-500/80 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
              >
                <Eye className="h-4 w-4" />
                عمومی
              </button>
            </div>
            <p className="text-xs leading-6 text-slate-500">پروفایل‌های جدید به‌صورت پیش‌فرض خصوصی هستند؛ عمومی‌کردن باید انتخاب صریح خودت باشد.</p>
          </div>

          <Button
            type="button"
            onClick={submit}
            disabled={pending || !username.trim() || !displayName.trim()}
            className="min-h-12 rounded-xl bg-gradient-to-l from-violet-600 to-blue-500 font-black text-white"
          >
            {pending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            ذخیره پروفایل
          </Button>

          {message && (
            <p role="status" className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
              {message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
