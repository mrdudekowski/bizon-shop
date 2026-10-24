/** Browser reads for public CMS data; this URL is public and contains no credentials. */
export async function fetchBrowserPublishedJson<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");

  const response = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
    credentials: "omit",
    signal,
  });
  if (!response.ok) throw new Error(`Published content API returned ${response.status}`);
  return response.json() as Promise<T>;
}

export async function fetchBrowserPublishedList<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const value: unknown = await fetchBrowserPublishedJson(path, signal);
  if (!Array.isArray(value)) throw new Error("Published content API returned an invalid list");
  return value as T[];
}
