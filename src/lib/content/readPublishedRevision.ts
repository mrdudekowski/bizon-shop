import { fetchBrowserPublishedJson } from "./browserPublishedClient";
import { shouldRefreshPublishedContent } from "./shouldRefreshPublishedContent";

export async function readPublishedRevision(signal?: AbortSignal): Promise<boolean> {
  const [builtResponse, live] = await Promise.all([
    fetch("/content-revision.json", { signal }),
    fetchBrowserPublishedJson<unknown>("/v1/content/revision", signal),
  ]);
  if (!builtResponse.ok) return process.env.NODE_ENV === "development";
  const built: unknown = await builtResponse.json();
  return shouldRefreshPublishedContent(built, live);
}
