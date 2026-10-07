const LOCAL_CMS_ORIGIN = /^https?:\/\/(127\.0\.0\.1|localhost):3001$/;
const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isAdminRequestOriginAllowed(
  path: string,
  method: string,
  origin: string | undefined,
): boolean {
  const isAdminPath = path === "/v1/admin" || path.startsWith("/v1/admin/");
  if (!isAdminPath || !STATE_CHANGING_METHODS.has(method.toUpperCase()) || !origin) return true;
  return LOCAL_CMS_ORIGIN.test(origin);
}

export function localOriginHeaders(origin: string | undefined): Record<string, string> {
  if (!origin || !LOCAL_CMS_ORIGIN.test(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type",
    // The CMS session lives in a cookie, so the browser only sends it when credentials are allowed.
    "access-control-allow-credentials": "true",
    vary: "origin",
  };
}
