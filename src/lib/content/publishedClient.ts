/** HTTP client for backend-app published content. No database access. */

export type PublishedFetchResult<T> =
  | { kind: "ok"; data: T; status: number; requestId: string | null; durationMs: number }
  | { kind: "not_found" }
  | { kind: "unavailable" }
  | { kind: "invalid_payload" }
  | { kind: "disabled" };

export class PublishedApiError extends Error {
  constructor(readonly kind: "unavailable" | "invalid_payload") {
    super(`Published content API ${kind}`);
    this.name = "PublishedApiError";
  }
}

export function isStaticBuild(): boolean {
  return process.env.NODE_ENV === "production";
}

export function publishedApiEnabled(): boolean {
  const url = process.env.CONTENT_API_URL;
  return typeof url === "string" && url.trim().length > 0;
}

function joinContentApiUrl(path: string): string {
  const base = (process.env.CONTENT_API_URL ?? "").trim().replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export async function fetchPublishedJson<T>(path: string): Promise<T | null> {
  const result = await fetchPublishedResult<T>(path);
  if (result.kind === "ok") return result.data;
  if (result.kind === "not_found" || result.kind === "disabled") return null;
  throw new PublishedApiError(result.kind);
}

export async function fetchPublishedList<T>(
  path: string,
  isValidItem: (item: unknown) => boolean = isRecord,
): Promise<T[]> {
  const result = await fetchPublishedResult<unknown>(path);
  if (result.kind === "ok") {
    if (Array.isArray(result.data) && result.data.every(isValidItem)) return result.data as T[];
    logPublishedFailure(path, "invalid_payload", result.status, result.requestId, result.durationMs);
    throw new PublishedApiError("invalid_payload");
  }
  if (result.kind === "not_found") {
    logPublishedFailure(path, "missing_list_route", 404, null, 0);
    throw new PublishedApiError("unavailable");
  }
  if (result.kind === "disabled") throw new PublishedApiError("unavailable");
  throw new PublishedApiError(result.kind);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function logPublishedFailure(
  path: string,
  reason: string,
  status: number | null,
  requestId: string | null,
  durationMs: number,
) {
  const safePath = new URL(path, "http://localhost").pathname;
  console.warn(JSON.stringify({
    event: "published_api.failure",
    path: safePath,
    status,
    durationMs: Math.max(0, Math.round(durationMs)),
    requestId,
    reason,
  }));
}

function responseRequestId(response: Response): string | null {
  return response.headers?.get?.("x-request-id") ?? null;
}

export async function fetchPublishedResult<T>(path: string): Promise<PublishedFetchResult<T>> {
  if (!publishedApiEnabled()) return { kind: "disabled" };

  let response: Response;
  const startedAt = Date.now();
  try {
    response = await fetch(joinContentApiUrl(path), { cache: "force-cache" });
  } catch {
    logPublishedFailure(path, "network_error", null, null, Date.now() - startedAt);
    return { kind: "unavailable" };
  }

  if (response.status === 404) return { kind: "not_found" };
  if (!response.ok) {
    logPublishedFailure(
      path,
      "http_error",
      response.status,
      responseRequestId(response),
      Date.now() - startedAt,
    );
    return { kind: "unavailable" };
  }

  try {
    return {
      kind: "ok",
      data: (await response.json()) as T,
      status: response.status,
      requestId: responseRequestId(response),
      durationMs: Date.now() - startedAt,
    };
  } catch {
    logPublishedFailure(
      path,
      "invalid_json",
      response.status,
      responseRequestId(response),
      Date.now() - startedAt,
    );
    return { kind: "invalid_payload" };
  }
}
