import { createHash } from "node:crypto";

/** Short digest identifying one exact published response without logging its content. */
export function createContentRevision(payload: string): string {
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export function createRequestLogRecord(input: {
  method?: string;
  url: string;
  statusCode: number;
  durationMs: number;
  requestId: string;
  contentRevision?: string | null;
}) {
  const path = new URL(input.url, "http://localhost").pathname;
  return {
    event: "http.request",
    requestId: input.requestId,
    method: input.method ?? "GET",
    path,
    status: input.statusCode,
    durationMs: Math.max(0, Math.round(input.durationMs)),
    ...(input.contentRevision ? { contentRevision: input.contentRevision } : {}),
  };
}
