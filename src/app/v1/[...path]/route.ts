export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND = (process.env.ADMIN_API_URL ?? "http://127.0.0.1:4000").replace(/\/+$/, "");

type RouteContext = { params: Promise<{ path: string[] }> };

/**
 * The browser talks only to this app. Next forwards /v1/* to backend-app, so the
 * session cookie stays on the CMS origin and never has to survive a cross-site hop.
 */
async function proxy(request: Request, path: string[]): Promise<Response> {
  const search = new URL(request.url).search;
  const target = `${BACKEND}/v1/${path.map(encodeURIComponent).join("/")}${search}`;
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const init: RequestInit = { method: request.method, headers, redirect: "manual" };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = Buffer.from(await request.arrayBuffer());
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return Response.json({ ok: false, code: "storage_unavailable" }, { status: 502 });
  }

  const out = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) out.set("content-type", upstreamType);
  for (const value of upstream.headers.getSetCookie()) out.append("set-cookie", value);

  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export async function GET(request: Request, context: RouteContext) {
  return proxy(request, (await context.params).path);
}

export async function POST(request: Request, context: RouteContext) {
  return proxy(request, (await context.params).path);
}

export async function OPTIONS(request: Request, context: RouteContext) {
  return proxy(request, (await context.params).path);
}
