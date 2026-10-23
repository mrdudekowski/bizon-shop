import { describe, expect, it } from "vitest";
import { articleImageIntentMigration } from "./0013-article-image-intent";

describe("Tire IQ article image intent migration", () => {
  it("preserves current legacy covers while tracking later explicit image edits", () => {
    expect(articleImageIntentMigration.version).toBe("202610220013");
    expect(articleImageIntentMigration.sql).toContain("featured_image_configured boolean NOT NULL DEFAULT false");
    expect(articleImageIntentMigration.sql).toContain("ADD COLUMN IF NOT EXISTS");
  });
});
