import { describe, expect, it } from "vitest";

import { MIGRATIONS } from "./index";
import { responsiveImageFocalPositionsMigration } from "./0039-responsive-image-focal-positions";

describe("responsive image focal positions migration", () => {
  it("registers an additive JSONB map while preserving legacy scalar columns", () => {
    expect(MIGRATIONS.at(-1)).toBe(responsiveImageFocalPositionsMigration);
    expect(responsiveImageFocalPositionsMigration.version).toBe("202611130039");
    expect(responsiveImageFocalPositionsMigration.sql).toContain("ADD COLUMN IF NOT EXISTS focal_by_viewport jsonb");
    expect(responsiveImageFocalPositionsMigration.sql).not.toMatch(/DROP\s+COLUMN\s+focal_[xy]/i);
    expect(responsiveImageFocalPositionsMigration.sql).toMatch(/jsonb_typeof\(focal_by_viewport\)\s*=\s*'object'/i);
  });
});
