import { describe, expect, it } from "vitest";

import { normalizeRequest } from "./normalizeRequest";
import { validateRequest } from "./validateRequest";
import type { IncomingRequestBody } from "./types";

const cartSources = ["cart", "tire_cart", "shop_cart"] as const;

function body(sourceForm: string, overrides: Partial<IncomingRequestBody> = {}): IncomingRequestBody {
  return {
    sourceForm,
    sourcePage: sourceForm === "shop_cart" ? "/shop/cart" : "/cart",
    name: "Alex",
    phone: "+79990000000",
    items: [{ itemType: "tire", itemId: "1", name: "Item", quantity: 1 }],
    ...overrides,
  };
}

describe("validateRequest cart sources", () => {
  it.each(cartSources)("accepts a complete %s request and preserves its normalized source", (sourceForm) => {
    const request = body(sourceForm);
    expect(validateRequest(request).ok).toBe(true);
    expect(normalizeRequest(request, {}).sourceForm).toBe(sourceForm);
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