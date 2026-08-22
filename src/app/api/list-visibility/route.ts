import { NextResponse } from "next/server";

import { logServerEvent, requestId } from "@/lib/observability";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const rid = requestId(request);
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "X-Request-Id": rid } },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { id?: number; is_public?: boolean }
    | null;

  if (!body || !Number.isInteger(body.id) || typeof body.is_public !== "boolean") {
    return NextResponse.json(
      { error: "invalid_request" },
      { status: 400, headers: { "X-Request-Id": rid } },
    );
  }

  const { error } = await supabase
    .from("user_lists")
    .update({ is_public: body.is_public })
    .eq("id", body.id)
    .eq("user_id", userId);

  if (error) {
    logServerEvent(
      "list_visibility.failed",
      { request_id: rid, user_id: userId, list_id: body.id },
      "error",
    );
    return NextResponse.json(
      { error: "update_failed" },
      { status: 500, headers: { "X-Request-Id": rid } },
    );
  }

  logServerEvent("list_visibility.updated", {
    request_id: rid,
    user_id: userId,
    list_id: body.id,
    is_public: body.is_public,
  });

  return NextResponse.json(
    { ok: true, is_public: body.is_public },
    { headers: { "Cache-Control": "no-store", "X-Request-Id": rid } },
  );
}
