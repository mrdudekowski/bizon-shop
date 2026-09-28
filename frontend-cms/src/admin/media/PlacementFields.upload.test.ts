import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("PlacementFields upload", () => {
  it("does not read the file as a data URL", () => {
    const source = fs.readFileSync(new URL("./PlacementFields.tsx", import.meta.url), "utf8");
    expect(source).not.toContain("readAsDataURL");
    expect(source).toContain("createAsset");
  });
});
