import { describe, expect, it } from "vitest";

import { validateRequest } from "./validateRequest";
import type { IncomingRequestBody } from "./types";

const cartSources = ["cart", "tire_cart", "shop_cart"] as const;

function body(sourceForm: string, overrides: Partial<IncomingRequestBody> = {}): IncomingRequestBody {
  return {
    sourceForm,
    name: "Alex",
    phone: "+79990000000",
    items: [{ name: "Item", quantity: 1 }],
    ...overrides,
  };
}

describe("validateRequest cart sources", () => {
  it.each(cartSources)("accepts a complete %s request", (sourceForm) => {
    expect(validateRequest(body(sourceForm)).ok).toBe(true);
  });

  it.each(cartSources)("requires items for %s", (sourceForm) => {
    expect(validateRequest(body(sourceForm, { items: [] }))).toMatchObject({
      ok: false,
      error: "missing_required_fields",
      message: "Cart is empty",
    });
  });

  it.each(cartSources)("requires a phone for %s", (sourceForm) => {
    expect(validateRequest(body(sourceForm, { phone: null, email: "a@example.com" }))).toMatchObject({
      ok: false,
      error: "missing_required_fields",
      message: "Please provide a phone number",
    });
  });

  it("keeps the existing contact validation contract", () => {
    expect(validateRequest(body("contact", { phone: null, email: "a@example.com", items: [] })).ok).toBe(true);
    expect(validateRequest(body("contact", { phone: null, email: null, items: [] })).ok).toBe(false);
  });
});