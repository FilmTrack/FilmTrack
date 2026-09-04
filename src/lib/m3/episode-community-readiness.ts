import { isCommunityContentRuntimeEnabled } from "@/lib/m3/community-content-readiness";

export const EPISODE_COMMUNITY_RUNTIME_FLAG =
  "NEXT_PUBLIC_FILMTRACK_M3_EPISODE_COMMUNITY_ENABLED";

export function isEpisodeCommunityRuntimeEnabled() {
  return (
    isCommunityContentRuntimeEnabled() &&
    process.env.NEXT_PUBLIC_FILMTRACK_M3_EPISODE_COMMUNITY_ENABLED === "true"
  );
}
