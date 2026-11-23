import { describe, expect, it } from "vitest";
import { splitTelegramText } from "./requestTelegramFormat";

function stripPartHeading(part: string): string {
  return part.replace(/^Новая заявка Bizon(?: #\S+)? — часть \d+ из \d+\n/, "");
}

describe("splitTelegramText", () => {
  it("returns no parts for an empty body", () => {
    expect(splitTelegramText("")).toEqual([]);
  });

  it("leaves a body under the limit unchanged and without a part heading", () => {
    const body = "Новая заявка Bizon #21\n\nКонтакты\nИмя: Анна";
    expect(splitTelegramText(body, 100)).toEqual([body]);
  });

  it("prefers line boundaries and reconstructs every original character", () => {
    const body = `Новая заявка Bizon #9\n\n${"Имя: Анна\n".repeat(12)}Последняя строка`;
    const parts = splitTelegramText(body, 90);

    expect(parts.length).toBeGreaterThan(1);
    expect(parts[0]).toMatch(/^Новая заявка Bizon #9 — часть 1 из \d+\n/);
    expect(parts.slice(0, -1).every((part) => stripPartHeading(part).endsWith("\n"))).toBe(true);
    expect(parts.map(stripPartHeading).join("")).toBe(body);
    expect(parts.every((part) => Array.from(part).length <= 90)).toBe(true);
  });

  it("splits overlong lines at Unicode code-point boundaries", () => {
    const body = `Новая заявка Bizon #12\nКомментарий: ${"🚚абв".repeat(120)}`;
    const parts = splitTelegramText(body, 80);

    expect(parts.length).toBeGreaterThan(1);
    expect(parts.map(stripPartHeading).join("")).toBe(body);
    expect(parts.every((part) => Array.from(part).length <= 80)).toBe(true);
    expect(parts.map(stripPartHeading).join("")).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/);
  });

  it("uses stable one-based part numbering and respects the default 3800-code-point limit", () => {
    const body = `Новая заявка Bizon #88\nСообщение: ${"длинный текст 🚛\n".repeat(550)}`;
    const parts = splitTelegramText(body);

    expect(parts.length).toBeGreaterThan(2);
    expect(parts.map((part) => part.match(/— часть (\d+) из (\d+)\n/)?.slice(1))).toEqual(
      parts.map((_, index) => [String(index + 1), String(parts.length)]),
    );
    expect(parts.every((part) => Array.from(part).length <= 3800)).toBe(true);
    expect(parts.map(stripPartHeading).join("")).toBe(body);
  });
});
