import { NextResponse } from "next/server";

import { logServerEvent, requestId } from "@/lib/observability";

const ALLOWED_EVENTS = new Set([
  "signup_started",
  "signup_completed",
  "search_submitted",
  "title_viewed",
  "watchlist_added",
  "import_started",
  "import_completed",
]);

export async function POST(request: Request) {
  const rid = requestId(request);
  const body = (await request.json().catch(() => null)) as
    | { event?: string; properties?: Record<string, string | number | boolean | null> }
    | null;

  if (!body?.event || !ALLOWED_EVENTS.has(body.event)) {
    return NextResponse.json(
      { error: "invalid_event" },
      { status: 400, headers: { "X-Request-Id": rid } },
    );
  }

  const safeProperties = Object.fromEntries(
    Object.entries(body.properties ?? {})
      .slice(0, 20)
      .filter(([key]) => !/email|phone|name|token|password|secret/i.test(key)),
  );

  logServerEvent("product.event", {
    request_id: rid,
    product_event: body.event,
    ...safeProperties,
  });

  return NextResponse.json(
    { ok: true },
    { status: 202, headers: { "Cache-Control": "no-store", "X-Request-Id": rid } },
  );
}
