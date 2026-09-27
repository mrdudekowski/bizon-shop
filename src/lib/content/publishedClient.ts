/** Published content for frontend work. Reads the baked snapshot, not the backend. */

import responses from "./snapshot/responses.json";

const snapshot = responses as Record<string, unknown>;

export function publishedApiEnabled(): boolean {
  return true;
}

export async function fetchPublishedJson<T>(path: string): Promise<T | null> {
  const key = path.startsWith("/") ? path : `/${path}`;
  if (!Object.hasOwn(snapshot, key)) return null;
  return snapshot[key] as T;
}
