import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

const CART_SESSION_COOKIE = "bizon-cart-session-v1";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function contentApiUrl(): string | null {
  const url = process.env.CONTENT_API_URL?.trim();
  return url ? url.replace(/\/+$/, "") : null;
}

function sessionToken(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const entry = cookie.split("; ").find((part) => part.startsWith(`${CART_SESSION_COOKIE}=`));
  if (!entry) return null;
  const value = decodeURIComponent(entry.slice(CART_SESSION_COOKIE.length + 1));
  return value || null;
}

function withSessionCookie(response: NextResponse, token: string | null) {
  response.cookies.set({
    name: CART_SESSION_COOKIE,
    value: token ?? "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: token ? SESSION_MAX_AGE : 0,
  });
  return response;
}

async function callCartBackend(method: "GET" | "PUT" | "DELETE", token: string, items?: unknown) {
  const apiUrl = contentApiUrl();
  if (!apiUrl) return null;
  return fetch(`${apiUrl}/v1/cart`, {
    method,
    headers: { "content-type": "application/json", "x-cart-token": token },
    body: method === "PUT" ? JSON.stringify({ items }) : undefined,
    cache: "no-store",
  });
}

export async function GET(request: Request) {
  const token = sessionToken(request);
  if (!token) {
    return NextResponse.json({ ok: true, hasSession: false, items: [] });
  }
  const upstream = await callCartBackend("GET", token);
  if (!upstream?.ok) {
    return NextResponse.json({ ok: true, hasSession: false, items: [] });
  }
  const body = (await upstream.json()) as { hasSession?: boolean; items?: unknown[] };
  return NextResponse.json({
    ok: true,
    hasSession: body.hasSession === true,
    items: body.items ?? [],
  });
}

export async function PUT(request: Request) {
  const apiUrl = contentApiUrl();
  if (!apiUrl) {
    return NextResponse.json(
      { ok: false, error: "backend_not_configured", message: "Server cart sync disabled." },
      { status: 503 },
    );
  }
  const body = (await request.json().catch(() => null)) as { items?: unknown } | null;
  const token = sessionToken(request) ?? randomBytes(32).toString("base64url");
  const upstream = await callCartBackend("PUT", token, body?.items ?? []);
  if (!upstream?.ok) {
    return NextResponse.json(
      { ok: false, error: "backend_not_configured", message: "Server cart sync disabled." },
      { status: 503 },
    );
  }
  return withSessionCookie(NextResponse.json({ ok: true }), token);
}

export async function DELETE(request: Request) {
  const token = sessionToken(request);
  if (token) await callCartBackend("DELETE", token);
  return withSessionCookie(NextResponse.json({ ok: true }), null);
}
