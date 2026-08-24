export const USER_LIST_STATUSES = [
  "plan_to_watch",
  "watching",
  "completed",
  "on_hold",
  "dropped",
] as const

export type UserListStatus = (typeof USER_LIST_STATUSES)[number]

export type TitleType = "movie" | "tv"

export type UserListWriteInput = {
  titleId: number
  titleType: TitleType
  status: UserListStatus
}
