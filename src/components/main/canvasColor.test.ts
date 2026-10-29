import { describe, expect, it } from "vitest";

import { inkForCanvas, mixHex, nextCanvasTone, resolveCanvasColor } from "./canvasColor";

describe("resolveCanvasColor", () => {
  it("keeps the current color while the next stop is still below the screen", () => {
    expect(resolveCanvasColor([
      { top: -200, color: "#0a0a0a" },
      { top: 1200, color: "#ffffff" },
    ], 1000, 80)).toBe("#0a0a0a");
  });

  it("is halfway between colors when the next stop is halfway up the screen", () => {
    const halfway = resolveCanvasColor([{ top: -40, color: "#000000" }, { top: 540, color: "#ffffff" }], 1000, 80);
    expect(halfway).toBe(mixHex("#000000", "#ffffff", (1000 - 540) / (1000 - 80)));
  });

  it("uses the incoming color once that stop reaches the header line", () => {
    expect(resolveCanvasColor([{ top: -400, color: "#0a0a0a" }, { top: 80, color: "#ffffff" }], 1000, 80)).toBe("#ffffff");
  });
});

describe("inkForCanvas", () => {
  it("uses dark ink on a light canvas and light ink on a dark canvas", () => {
    expect(inkForCanvas("#ffffff")).toBe("#1c1c1c");
    expect(inkForCanvas("#0a0a0a")).toBe("#ffffff");
  });
});

describe("nextCanvasTone", () => {
  it("holds the last tone when the band has no section", () => {
    expect(nextCanvasTone(null, "dark")).toBe("dark");
    expect(nextCanvasTone(null, "light")).toBe("light");
  });

  it("follows a real section tone", () => {
    expect(nextCanvasTone("light", "dark")).toBe("light");
    expect(nextCanvasTone("dark", "light")).toBe("dark");
  });

  it("holds on an unknown tone instead of treating it as white", () => {
    expect(nextCanvasTone("nope", "dark")).toBe("dark");
  });
});
