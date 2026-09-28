import { describe, expect, it } from "vitest";

import type { TireCatalogModel } from "./tireReadModel";
import { cardSubtitle, formatAxleLabels } from "./featuredAssortment";

const model = {
  selectionAxles: ["steer", "drive"],
  axlePosition: "",
  applicationCategory: "long_haul",
  tireTypeName: "TBR",
} as Pick<TireCatalogModel, "selectionAxles" | "axlePosition" | "applicationCategory" | "tireTypeName">;

describe("formatAxleLabels", () => {
  it("joins catalog axles", () => {
    expect(formatAxleLabels(model)).toBe("Рулевая / Ведущая");
  });

  it("collapses all three axles", () => {
    expect(formatAxleLabels({ ...model, selectionAxles: ["steer", "drive", "trailer"] })).toBe("Все оси");
  });
});

describe("cardSubtitle", () => {
  it("uses a single axle as the line under the name", () => {
    expect(cardSubtitle({ ...model, selectionAxles: ["trailer"] })).toBe("Прицепная");
  });

  it("falls back to universal when axles are mixed", () => {
    expect(cardSubtitle(model)).toBe("Магистральные");
    expect(cardSubtitle({ ...model, applicationCategory: "unknown" })).toBe("Универсальные");
  });
});
