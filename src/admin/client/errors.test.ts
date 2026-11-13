import { describe, expect, it } from "vitest";

import { databaseErrorDiagnostics } from "./errors";

describe("databaseErrorDiagnostics", () => {
  it("extracts only PostgreSQL diagnostic fields", () => {
    const error = Object.assign(new Error("insert failed"), {
      code: "23502",
      schema: "public",
      table: "cms_image_focal_positions",
      column: "focal_by_viewport",
      constraint: "cms_image_focal_positions_focal_by_viewport_check",
      detail: "sensitive database detail",
    });

    expect(databaseErrorDiagnostics(error)).toEqual({
      code: "23502",
      schema: "public",
      table: "cms_image_focal_positions",
      column: "focal_by_viewport",
      constraint: "cms_image_focal_positions_focal_by_viewport_check",
    });
  });

  it("returns no database diagnostics for an arbitrary error", () => {
    expect(databaseErrorDiagnostics(new Error("request failed"))).toBeNull();
  });
});
