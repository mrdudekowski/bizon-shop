import { describe, expect, it } from "vitest";

import { mergeLegacyPageOverlay } from "./pageOverlay";

describe("mergeLegacyPageOverlay", () => {
  it("drops the retired selection entry from legacy Home overlays", () => {
    const result = mergeLegacyPageOverlay(
      { id: "home", hero: { title: "Главная" }, resume: { title: "Три ответа" } },
      { selectionEntry: { title: "Старый подбор" }, resume: { title: "Продолжить подбор" } },
    );

    expect("selectionEntry" in result).toBe(false);
    expect("resume" in result).toBe(false);
  });

  it("treats a current stub-page draft's omitted editorial fields as cleared", () => {
    const result = mergeLegacyPageOverlay(
      { id: "warranty", sections: [{ id: "old", heading: "Old", body: "Old body" }], features: [{ id: "f", title: "Old", text: "Old" }] },
      { id: "warranty", documents: [], hero: { title: "Warranty" } },
    );

    expect(result).not.toHaveProperty("sections");
    expect(result).not.toHaveProperty("features");
  });

  it("keeps editorial fields from published data when merging a legacy stub overlay", () => {
    const result = mergeLegacyPageOverlay(
      { id: "warranty", sections: [{ id: "old", heading: "Published", body: "Keep it" }] },
      { id: "warranty", hero: { title: "Warranty" } },
    );

    expect(result).toMatchObject({ sections: [{ id: "old", heading: "Published", body: "Keep it" }] });
  });
});
