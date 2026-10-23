import { describe, expect, it } from "vitest";
import { approvedTireBenefitCopyMigration } from "./0014-approved-tire-benefit-copy";

describe("approved tire benefit copy migration", () => {
  it("guards the reviewed source population and updates the published rows plus saved draft overlays", () => {
    const sql = approvedTireBenefitCopyMigration.sql;
    expect(approvedTireBenefitCopyMigration.version).toBe("202610220014");
    expect(sql).toContain("marker_count <> 66 OR title_count <> 17");
    expect(sql).toContain("Found an unmapped editorial benefit marker");
    expect(sql).toContain("UPDATE tire_models_features AS feature");
    expect(sql).toContain("UPDATE cms_drafts AS draft");
    expect(sql).toContain("ORDER BY feature_order");
    expect(sql).toContain("Editorial benefit markers remain");

    const mappings = [...sql.matchAll(/\('([^']+)', '([^']+)'\)/g)].map((match) => [match[1], match[2]]);
    expect(mappings).toHaveLength(34);
    expect(mappings.slice(0, 17)).toEqual(mappings.slice(17));
    expect(new Set(mappings.slice(0, 17).map(([title]) => title)).size).toBe(17);
  });
});
