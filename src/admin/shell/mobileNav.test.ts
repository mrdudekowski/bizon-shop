import { describe, expect, it } from "vitest";
import { isMoreCurrent, isNavCurrent, profileInitials, splitNav } from "./mobileNav";

const items = [
  { href: "/", label: "Шины" },
  { href: "/wheels", label: "Диски" },
  { href: "/shop", label: "Shop" },
  { href: "/pages", label: "Страницы" },
  { href: "/materials", label: "Материалы" },
  { href: "/users", label: "Пользователи" },
];

describe("splitNav", () => {
  it("keeps tires, wheels, shop as primary and the rest as more", () => {
    const { primary, more } = splitNav(items);
    expect(primary.map((item) => item.href)).toEqual(["/", "/wheels", "/shop"]);
    expect(more.map((item) => item.href)).toEqual(["/pages", "/materials", "/users"]);
  });
});

describe("isNavCurrent", () => {
  it("treats tire model routes as Шины, but not direction editors", () => {
    expect(isNavCurrent("/tires/21", "/")).toBe(true);
    expect(isNavCurrent("/tires/directions/1", "/")).toBe(false);
    expect(isNavCurrent("/wheels/3", "/wheels")).toBe(true);
    expect(isNavCurrent("/shop", "/shop")).toBe(true);
  });
});

describe("isMoreCurrent", () => {
  it("is true on overflow routes only", () => {
    const more = splitNav(items).more;
    expect(isMoreCurrent("/pages/home", more)).toBe(true);
    expect(isMoreCurrent("/materials/9", more)).toBe(true);
    expect(isMoreCurrent("/users", more)).toBe(true);
    expect(isMoreCurrent("/", more)).toBe(false);
    expect(isMoreCurrent("/wheels", more)).toBe(false);
  });
});

describe("profileInitials", () => {
  it("uses two letters from login local-part", () => {
    expect(profileInitials("chief")).toBe("CH");
    expect(profileInitials("ada.l@example.com")).toBe("AL");
    expect(profileInitials("  ")).toBe("?");
  });
});
