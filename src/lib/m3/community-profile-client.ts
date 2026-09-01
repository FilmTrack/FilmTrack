import { createClient } from "@/lib/supabase/client";
import {
  sanitizeCommunityBio,
  sanitizeCommunityDisplayName,
  validateCommunityUsername,
  type CommunityProfileVisibility,
} from "@/lib/community-identity";
import { isCommunityRuntimeEnabled } from "@/lib/m3/readiness";

export type CommunityProfileWriteResult =
  | { ok: true }
  | { ok: false; reason: "runtime_unavailable" | "unauthenticated" | "invalid_username"; message: string }
  | { ok: false; reason: "write_failed"; message: string };

export async function saveCommunityProfile(input: {
  username: string;
  displayName: string;
  bio?: string | null;
  visibility: CommunityProfileVisibility;
}): Promise<CommunityProfileWriteResult> {
  if (!isCommunityRuntimeEnabled()) {
    return {
      ok: false,
      reason: "runtime_unavailable",
      message: "پروفایل اجتماعی هنوز برای حساب شما فعال نشده است.",
    };
  }

  const username = validateCommunityUsername(input.username);
  if (!username.ok) {
    return {
      ok: false,
      reason: "invalid_username",
      message: "نام کاربری باید ۳ تا ۲۴ نویسه و فقط شامل حروف انگلیسی کوچک، عدد یا زیرخط باشد.",
    };
  }

  const displayName = sanitizeCommunityDisplayName(input.displayName);
  if (!displayName) {
    return {
      ok: false,
      reason: "write_failed",
      message: "نام نمایشی نمی‌تواند خالی باشد.",
    };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      reason: "unauthenticated",
      message: "برای ساخت پروفایل وارد حساب شو.",
    };
  }

  const { error } = await supabase.from("community_profiles").upsert(
    {
      user_id: user.id,
      username: username.username,
      display_name: displayName,
      bio: sanitizeCommunityBio(input.bio),
      visibility: input.visibility,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return {
      ok: false,
      reason: "write_failed",
      message: error.code === "23505"
        ? "این نام کاربری قبلاً انتخاب شده است."
        : "ذخیره پروفایل انجام نشد؛ دوباره تلاش کن.",
    };
  }

  return { ok: true };
}
