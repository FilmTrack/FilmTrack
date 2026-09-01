export type CommunityProfileVisibility = "private" | "public";

export type CommunityProfile = {
  userId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  visibility: CommunityProfileVisibility;
  createdAt: string;
  updatedAt: string;
};

export type PublicCommunityProfile = Pick<
  CommunityProfile,
  "username" | "displayName" | "bio" | "avatarUrl" | "visibility" | "createdAt"
>;

export const COMMUNITY_USERNAME_MIN_LENGTH = 3;
export const COMMUNITY_USERNAME_MAX_LENGTH = 24;
export const COMMUNITY_DISPLAY_NAME_MAX_LENGTH = 48;
export const COMMUNITY_BIO_MAX_LENGTH = 240;

const USERNAME_PATTERN = /^[a-z0-9_]+$/;

export function normalizeCommunityUsername(value: string) {
  return value.trim().toLowerCase();
}

export function validateCommunityUsername(value: string) {
  const username = normalizeCommunityUsername(value);

  if (username.length < COMMUNITY_USERNAME_MIN_LENGTH) {
    return { ok: false as const, reason: "too_short" as const };
  }

  if (username.length > COMMUNITY_USERNAME_MAX_LENGTH) {
    return { ok: false as const, reason: "too_long" as const };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false as const, reason: "invalid_characters" as const };
  }

  return { ok: true as const, username };
}

export function sanitizeCommunityDisplayName(value: string) {
  return value.trim().slice(0, COMMUNITY_DISPLAY_NAME_MAX_LENGTH);
}

export function sanitizeCommunityBio(value: string | null | undefined) {
  const bio = value?.trim() ?? "";
  return bio ? bio.slice(0, COMMUNITY_BIO_MAX_LENGTH) : null;
}

export function toPublicCommunityProfile(
  profile: CommunityProfile,
): PublicCommunityProfile | null {
  if (profile.visibility !== "public") return null;

  return {
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    visibility: profile.visibility,
    createdAt: profile.createdAt,
  };
}

export function canViewCommunityProfile(input: {
  viewerUserId?: string | null;
  profileOwnerUserId: string;
  visibility: CommunityProfileVisibility;
}) {
  if (input.viewerUserId === input.profileOwnerUserId) return true;
  return input.visibility === "public";
}

export function canMutateCommunityProfile(input: {
  viewerUserId?: string | null;
  profileOwnerUserId: string;
}) {
  return Boolean(
    input.viewerUserId && input.viewerUserId === input.profileOwnerUserId,
  );
}
