import { describe, expect, it } from "vitest";
import { stubHeroContentMigration } from "./0015-stub-hero-content";

describe("stub hero CMS ownership migration", () => {
  it("tracks CMS ownership without changing legacy fallback rows", () => {
    expect(stubHeroContentMigration.version).toBe("202610230015");
    expect(stubHeroContentMigration.sql).toContain("stub_hero_configured boolean NOT NULL DEFAULT false");
    expect(stubHeroContentMigration.sql).toContain("AND status = 'published'");
  });
});
