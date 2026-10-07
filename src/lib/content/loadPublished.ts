import { PublishedApiError, publishedApiEnabled } from "./publishedClient";

export type PublishedLoad<T> =
  | { kind: "ok"; value: T }
  | { kind: "unavailable" };

export async function loadPublished<T>(loader: () => Promise<T>): Promise<PublishedLoad<T>> {
  if (!publishedApiEnabled()) return { kind: "unavailable" };

  try {
    return { kind: "ok", value: await loader() };
  } catch (error) {
    if (error instanceof PublishedApiError) return { kind: "unavailable" };
    throw error;
  }
}
