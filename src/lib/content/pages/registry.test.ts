import { describe, expect, it } from "vitest";

import { getPageRegistryEntry } from "./registry";

describe("shop service registry titles", () => {
  it("keeps shop titles distinct from the tire-site pair", () => {
    expect(getPageRegistryEntry("shop-delivery").title).toBe("Доставка BIZON Shop");
    expect(getPageRegistryEntry("shop-payment").title).toBe("Оплата BIZON Shop");
    expect(getPageRegistryEntry("shop-warranty").title).toBe("Гарантия и возврат BIZON Shop");
    expect(getPageRegistryEntry("shop-become-a-supplier").title).toBe("Поставщикам BIZON Shop");
    expect(getPageRegistryEntry("delivery").title).not.toBe(getPageRegistryEntry("shop-delivery").title);
    expect(getPageRegistryEntry("shop-delivery").description).toContain("BIZON Shop");
  });
});
