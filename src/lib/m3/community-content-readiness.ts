import { isCommunityRuntimeEnabled } from "@/lib/m3/readiness";

export const COMMUNITY_CONTENT_RUNTIME_FLAG =
  "NEXT_PUBLIC_FILMTRACK_M3_COMMUNITY_CONTENT_ENABLED";

export function isCommunityContentRuntimeEnabled() {
  return (
    isCommunityRuntimeEnabled() &&
    process.env.NEXT_PUBLIC_FILMTRACK_M3_COMMUNITY_CONTENT_ENABLED === "true"
  );
}
