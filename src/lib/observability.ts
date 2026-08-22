type LogLevel = "info" | "warn" | "error";

type EventFields = Record<string, string | number | boolean | null | undefined>;

export function logServerEvent(
  event: string,
  fields: EventFields = {},
  level: LogLevel = "info",
) {
  const payload = {
    ts: new Date().toISOString(),
    service: "filmtrack-web",
    event,
    ...fields,
  };

  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export function requestId(request: Request) {
  return request.headers.get("x-request-id") || crypto.randomUUID();
}
