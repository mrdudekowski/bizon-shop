import fs from "node:fs";

import { describe, expect, it } from "vitest";

import { TIRE_MODEL_PUBLISH_COLUMNS } from "./postgresAdmin";

describe("writeTireModel publish columns", () => {
  it("includes tread_type and series in the exported columns and UPDATE SQL", () => {
    expect(TIRE_MODEL_PUBLISH_COLUMNS).toEqual(
      expect.arrayContaining(["tread_type", "series"]),
    );

    const source = fs.readFileSync(new URL("./postgresAdmin.ts", import.meta.url), "utf8");
    const writeFnStart = source.indexOf("async function writeTireModel");
    const writeFnEnd = source.indexOf("async function publishStatus", writeFnStart);
    const writeTireModelSource = source.slice(writeFnStart, writeFnEnd);

    expect(writeTireModelSource).toContain("tread_type");
    expect(writeTireModelSource).toContain("series");
    expect(writeTireModelSource).toMatch(/COALESCE\s*\(\s*NULLIF/);
  });
});
