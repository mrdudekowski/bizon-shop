import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("listTireModels", () => {
  it("returns directionId so CMS can group models by TBR/OTR", () => {
    const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");
    const start = source.indexOf("async listTireModels");
    const end = source.indexOf("async getTireModel", start);
    const block = source.slice(start, end);

    expect(block).toContain("directionId: record.draft.directionId");
  });
});
