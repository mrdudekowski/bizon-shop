import fs from "node:fs";

import { describe, expect, it } from "vitest";

describe("retired TBR Excel importer", () => {
  const importerSource = fs.readFileSync(
    new URL("../../../../scripts/import-tbr-catalog.ts", import.meta.url),
    "utf8",
  );

  it("fails fast without loading Payload or targeting model-features", () => {
    expect(importerSource).toMatch(/^throw new Error\(/);
    expect(importerSource).toMatch(/agent-reference only/i);
    expect(importerSource).not.toContain("getPayload");
    expect(importerSource).not.toContain('"model-features"');
  });
});
