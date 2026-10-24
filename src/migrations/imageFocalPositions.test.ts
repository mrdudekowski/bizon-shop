import { describe, expect, it } from "vitest";
import { imageFocalPositionsMigration } from "./0018-image-focal-position";

describe("CMS image focal positions migration", () => {
  it("stores a separate position per CMS placement and asset with center defaults", () => {
    expect(imageFocalPositionsMigration.version).toBe("202610250018");
    expect(imageFocalPositionsMigration.sql).toContain("PRIMARY KEY (collection, doc_id, placement_path)");
    expect(imageFocalPositionsMigration.sql).toContain("media_id integer NOT NULL REFERENCES media(id) ON DELETE CASCADE");
    expect(imageFocalPositionsMigration.sql).toContain("focal_x double precision NOT NULL DEFAULT 0.5");
    expect(imageFocalPositionsMigration.sql).toContain("focal_y double precision NOT NULL DEFAULT 0.5");
  });
});
