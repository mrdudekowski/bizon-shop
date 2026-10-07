const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function allowedOrigins(): Set<string> {
  const configured = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (configured.length > 0) return new Set(configured);
  if (process.env.NODE_ENV === "production") return new Set();
  return new Set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
  ]);
}

export function isAdminRequestOriginAllowed(
  _path: string,
  _method: string,
  origin: string | undefined,
): boolean {
  // Requests from other servers and command-line tools have no Origin header.
  if (!origin) return true;
  return allowedOrigins().has(origin);
}

export function localOriginHeaders(origin: string | undefined): Record<string, string> {
  if (!origin || !allowedOrigins().has(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-allow-credentials": "true",
    "access-control-expose-headers": "x-bizon-site-deploy",
    "access-control-max-age": "600",
    vary: "origin",
  };
}

export function isStateChangingMethod(method: string): boolean {
  return STATE_CHANGING_METHODS.has(method.toUpperCase());
}
