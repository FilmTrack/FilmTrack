export const ACCOUNT_DELETE_RUNTIME_FLAG =
  "NEXT_PUBLIC_FILMTRACK_ACCOUNT_DELETE_ENABLED";

export function isAccountDeleteRuntimeEnabled() {
  return process.env.NEXT_PUBLIC_FILMTRACK_ACCOUNT_DELETE_ENABLED === "true";
}
