import { describe, expect, it } from "vitest";
import { shopProductCountLabel } from "./shopProductCountLabel";

describe("shopProductCountLabel", () => {
  it.each([
    [0, "0 товаров"],
    [1, "1 товар"],
    [2, "2 товара"],
    [4, "4 товара"],
    [5, "5 товаров"],
    [11, "11 товаров"],
    [12, "12 товаров"],
    [14, "14 товаров"],
    [21, "21 товар"],
    [22, "22 товара"],
    [25, "25 товаров"],
    [101, "101 товар"],
    [111, "111 товаров"],
  ])("formats %i products according to Russian count rules", (count, expected) => {
    expect(shopProductCountLabel(count)).toBe(expected);
  });
});
