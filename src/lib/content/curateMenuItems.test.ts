import { describe, expect, it } from "vitest";
import { curateMenuItems } from "./curateMenuItems";

describe("curateMenuItems", () => {
  it("keeps only showInMenu items ordered by menuOrder", () => {
    const result = curateMenuItems([
      { id: "a", showInMenu: true, menuOrder: 2 },
      { id: "b", showInMenu: false, menuOrder: 0 },
      { id: "c", showInMenu: true, menuOrder: 1 },
    ]);
    expect(result.map((item) => item.id)).toEqual(["c", "a"]);
  });

  it("falls back to first 12 when no item is flagged", () => {
    const items = Array.from({ length: 15 }, (_, index) => ({
      id: String(index),
      showInMenu: false,
      menuOrder: index,
    }));
    const result = curateMenuItems(items);
    expect(result).toHaveLength(12);
    expect(result[0]?.id).toBe("0");
    expect(result[11]?.id).toBe("11");
  });

  it("treats null/undefined showInMenu as not flagged for the prefer path", () => {
    const result = curateMenuItems([
      { id: "a", showInMenu: null, menuOrder: 0 },
      { id: "b", menuOrder: 1 },
      { id: "c", showInMenu: true, menuOrder: 2 },
    ]);
    expect(result.map((item) => item.id)).toEqual(["c"]);
  });
});
