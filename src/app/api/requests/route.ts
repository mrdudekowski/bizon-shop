import { NextResponse } from "next/server";

import { normalizeRequest } from "@/lib/requests/normalizeRequest";
import { parseRequestBody, validateRequest } from "@/lib/requests/validateRequest";
import {
  checkRateLimit,
  rateLimitKeyFromRequest,
} from "@/lib/security/rateLimit";

function contentApiUrl(): string | null {
  const url = process.env.CONTENT_API_URL?.trim();
  return url ? url.replace(/\/+$/, "") : null;
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(rateLimitKeyFromRequest(request, "requests"));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limit_exceeded", message: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const apiUrl = contentApiUrl();
  if (!apiUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "backend_not_configured",
        message: "Request submission is not configured yet. backend-app will handle leads.",
      },
      { status: 503 },
    );
  }

  const raw = await request.json().catch(() => null);
  const parsed = parseRequestBody(raw);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error, message: parsed.message }, { status: 400 });
  }
  const validated = validateRequest(parsed.body);
  if (!validated.ok) {
    return NextResponse.json(
      { ok: false, error: validated.error, message: validated.message },
      { status: 400 },
    );
  }

  const normalized = normalizeRequest(validated.body, {
    sourceIp: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  });

  try {
    const upstream = await fetch(`${apiUrl}/v1/requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(normalized),
      cache: "no-store",
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: "request_create_failed", message: "Could not save the request" },
        { status: 502 },
      );
    }
    const saved = (await upstream.json()) as { requestId?: string | number };
    return NextResponse.json({
      ok: true,
      requestId: saved.requestId ?? "",
      message: "Заявка принята",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "request_create_failed", message: "Could not save the request" },
      { status: 502 },
    );
  }
}
