import { NextResponse } from "next/server";

/** Stage 1: cart is localStorage-only on main-app. */
export async function GET() {
  return NextResponse.json(
    { ok: false, error: "backend_not_configured", message: "Server cart sync disabled." },
    { status: 503 },
  );
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "backend_not_configured", message: "Server cart sync disabled." },
    { status: 503 },
  );
}
