/** HTTP client for backend-app published content. No database access. */

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
  if (!publishedApiEnabled()) {
    return null;
  }

  try {
    const response = await fetch(joinContentApiUrl(path), { cache: "no-store" });
    if (response.status === 404 || !response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
