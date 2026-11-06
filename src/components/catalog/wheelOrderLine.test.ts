import { describe, expect, it } from "vitest";

import { buildWheelOrderLine } from "./WheelOrderPanel";

describe("buildWheelOrderLine", () => {
  it("keeps the price and separates a size with and without beadlock", () => {
    const shared = {
      selectedId: "42",
      price: 15000,
      priceOnRequest: false,
      fitment: [] as string[],
      detailNotes: ["Автомобиль: КАМАЗ 5490"],
    };
    const off = buildWheelOrderLine({ ...shared, withBeadlock: false });
    const on = buildWheelOrderLine({ ...shared, withBeadlock: true });

    expect(off.notes).toBe("Автомобиль: КАМАЗ 5490; Без бедлока");
    expect(on.notes).toBe("Автомобиль: КАМАЗ 5490; С бедлоком");
    expect(off.variantId).toBe("42");
    expect(on.variantId).not.toBe(off.variantId);
    expect(off.price).toBe(on.price);
    expect(off.priceOnRequest).toBe(on.priceOnRequest);

    const packed = buildWheelOrderLine({
      ...shared,
      withBeadlock: true,
      detailNotes: ["А".repeat(320)],
    });
    expect(packed.notes.startsWith("С бедлоком")).toBe(true);
    expect(packed.notes.length).toBeLessThanOrEqual(300);
  });
});
