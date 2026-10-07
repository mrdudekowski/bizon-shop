/** Public API URL is compiled into the static bundle and contains no secret. */
export function publicApiUrl(path: string): string | null {
  const configured = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  const base = configured || (process.env.NODE_ENV === "development" ? "http://127.0.0.1:4000" : "");
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
