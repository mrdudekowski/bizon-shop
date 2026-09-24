import { NextResponse } from "next/server";

import {
  checkRateLimit,
  rateLimitKeyFromRequest,
} from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(rateLimitKeyFromRequest(request, "requests"));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limit_exceeded", message: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error: "backend_not_configured",
      message: "Request submission is not configured yet. backend-app will handle leads.",
    },
    { status: 503 },
  );
}
