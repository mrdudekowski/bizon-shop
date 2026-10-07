import type { IncomingRequestBody, RequestValidationError } from "./types";

const HONEYPOT_FIELD = "website";

function cleanString(value: unknown, maxLength = 500): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

export type ValidationResult =
  | { ok: true; body: IncomingRequestBody }
  | { ok: false; error: RequestValidationError; message: string };

export function parseRequestBody(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      error: "invalid_request_body",
      message: "Invalid request body",
    };
  }

  return { ok: true, body: raw as IncomingRequestBody };
}

export function validateRequest(body: IncomingRequestBody): ValidationResult {
  const honeypot = cleanString(body[HONEYPOT_FIELD], 200);
  if (honeypot) {
    return {
      ok: false,
      error: "honeypot_triggered",
      message: "Request rejected",
    };
  }

  const name = cleanString(body.name, 120);
  const phone = cleanString(body.phone, 40);
  const email = cleanString(body.email, 120);
  const sourceForm = cleanString(body.sourceForm, 40) ?? "custom";

  if (!name) {
    return {
      ok: false,
      error: "missing_required_fields",
      message: "Please provide your name",
    };
  }

  const isQuickOrder = sourceForm === "product_quick_order";
  const isCart = sourceForm === "cart";

  if (isCart) {
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return {
        ok: false,
        error: "missing_required_fields",
        message: "Cart is empty",
      };
    }
    if (!phone) {
      return {
        ok: false,
        error: "missing_required_fields",
        message: "Please provide a phone number",
      };
    }
  } else if (isQuickOrder) {
    if (!phone) {
      return {
        ok: false,
        error: "missing_required_fields",
        message: "Please provide a phone number",
      };
    }
  } else if (!phone && !email) {
    return {
      ok: false,
      error: "missing_required_fields",
      message: "Please provide a phone number or email",
    };
  }

  return { ok: true, body };
}

export { HONEYPOT_FIELD };
