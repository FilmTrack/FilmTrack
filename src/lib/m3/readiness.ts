export const COMMUNITY_RUNTIME_FLAG =
  "NEXT_PUBLIC_FILMTRACK_M3_COMMUNITY_ENABLED";

export function isCommunityRuntimeEnabled() {
  return process.env.NEXT_PUBLIC_FILMTRACK_M3_COMMUNITY_ENABLED === "true";
}
