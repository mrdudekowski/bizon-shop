import { isStaticBuild, PublishedApiError, publishedApiEnabled } from "./publishedClient";

export type PublishedLoad<T> =
  | { kind: "ok"; value: T }
  | { kind: "unavailable" };

export async function loadPublished<T>(loader: () => Promise<T>): Promise<PublishedLoad<T>> {
  if (!publishedApiEnabled()) {
    if (isStaticBuild()) throw new Error("CONTENT_API_URL is required to build the static public site.");
    return { kind: "unavailable" };
  }

  try {
    return { kind: "ok", value: await loader() };
  } catch (error) {
    if (error instanceof PublishedApiError) {
      if (isStaticBuild()) throw error;
      return { kind: "unavailable" };
    }
    throw error;
  }
}
