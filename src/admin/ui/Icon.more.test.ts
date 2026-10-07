import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("Icon more", () => {
  it("registers a more glyph", () => {
    const source = fs.readFileSync(new URL("./Icon.tsx", import.meta.url), "utf8");
    expect(source).toContain('"more"');
    expect(source).toMatch(/more:\s*"/);
  });
});
