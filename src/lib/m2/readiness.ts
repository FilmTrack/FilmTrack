export const RATING_DIARY_RUNTIME_FLAG =
  "NEXT_PUBLIC_FILMTRACK_M2_RATING_DIARY_ENABLED";

export function isRatingDiaryRuntimeEnabled() {
  return process.env.NEXT_PUBLIC_FILMTRACK_M2_RATING_DIARY_ENABLED === "true";
}
