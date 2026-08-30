export type ProductEvent =
  | "signup_started"
  | "signup_completed"
  | "search_submitted"
  | "title_viewed"
  | "watchlist_added"
  | "import_started"
  | "import_completed"
  | "rating_created"
  | "rating_updated"
  | "rating_removed"
  | "diary_entry_created"
  | "diary_entry_removed"
  | "rewatch_recorded";

export async function trackProductEvent(
  event: ProductEvent,
  properties: Record<string, string | number | boolean | null> = {},
) {
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, properties }),
      keepalive: true,
    });
  } catch {
    // Analytics must never block the user's core action.
  }
}
