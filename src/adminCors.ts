function parseOrigins(value: string | undefined): Set<string> {
  return new Set((value ?? "").split(",").map((origin) => origin.trim()).filter(Boolean));
}

function isAdminRoute(path: string): boolean {
  return path === "/v1/admin" || path.startsWith("/v1/admin/");
}

function allowedOrigins(path: string): Set<string> {
  const adminRoute = isAdminRoute(path);
  const configured = parseOrigins(
    adminRoute ? process.env.CMS_ALLOWED_ORIGINS : process.env.CORS_ALLOWED_ORIGINS,
  );
  if (configured.size > 0) return configured;
  if (process.env.NODE_ENV === "production") return new Set();

  return adminRoute
    ? new Set(["http://localhost:3001", "http://127.0.0.1:3001"])
    : new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);
}

/** Keep browser access to the CMS API separate from public website API access. */
export function isRequestOriginAllowed(
  path: string,
  _method: string,
  origin: string | undefined,
): boolean {
  // Requests from other servers and command-line tools have no Origin header.
  if (!origin) return true;
  return allowedOrigins(path).has(origin);
}

export function localOriginHeaders(path: string, origin: string | undefined): Record<string, string> {
  if (!origin || !allowedOrigins(path).has(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-allow-credentials": "true",
    "access-control-expose-headers": "x-bizon-site-deploy, x-bizon-site-deploy-id, x-bizon-content-revision",
    "access-control-max-age": "600",
    vary: "origin",
  };
}

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isStateChangingMethod(method: string): boolean {
  return STATE_CHANGING_METHODS.has(method.toUpperCase());
}
