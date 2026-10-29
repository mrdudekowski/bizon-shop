import { describe, expect, it } from "vitest";
import { replaceSeededCopy } from "./replaceSeededCopy";

describe("replaceSeededCopy", () => {
  it("replaces an empty or previously seeded paragraph", () => {
    expect(replaceSeededCopy("", "старый", "новый")).toBe("новый");
    expect(replaceSeededCopy("старый", "старый", "новый")).toBe("новый");
  });

  it("leaves editor text alone and is idempotent", () => {
    expect(replaceSeededCopy("текст юриста", "старый", "новый")).toBe("текст юриста");
    expect(replaceSeededCopy("новый", "старый", "новый")).toBe("новый");
  });
});
