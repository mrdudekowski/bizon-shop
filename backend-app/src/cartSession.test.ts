import { describe, expect, it } from "vitest";
import { hashCartToken, sanitizeCartItems } from "./cartSession";

describe("cart session", () => {
  it("stores a hash instead of the cookie token and drops extra item fields", () => {
    const token = "opaque-token";
    const hash = hashCartToken(token);
    expect(hash).not.toBe(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(
      sanitizeCartItems([
        { itemType: "tire", itemId: "1", name: "DSR188", quantity: 2, secret: "no" },
      ]),
    ).toEqual([{ itemType: "tire", itemId: "1", name: "DSR188", quantity: 2 }]);
  });
});