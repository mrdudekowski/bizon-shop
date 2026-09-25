import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { TIRE_PERFORMANCE_FEATURE_OPTIONS } from "@/collections/fields/tireCatalogFields";
import { FEATURE_IMAGE_KEYS, getFeatureImage } from "./featureImages";

describe("featureImages", () => {
  it("covers every CMS performance feature key", () => {
    const cmsKeys = TIRE_PERFORMANCE_FEATURE_OPTIONS.map((o) => o.value);
    expect([...FEATURE_IMAGE_KEYS].sort()).toEqual([...cmsKeys].sort());
  });

  it("resolves a public src and label for each key", () => {
    for (const key of FEATURE_IMAGE_KEYS) {
      const image = getFeatureImage(key);
      expect(image).not.toBeNull();
      expect(image!.src).toBe(`/images/catalog/features/${key}.png`);
      expect(image!.label.length).toBeGreaterThan(0);
      expect(image!.alt.length).toBeGreaterThan(0);

      const diskPath = join(process.cwd(), "public", "images", "catalog", "features", `${key}.png`);
      expect(existsSync(diskPath), `missing file for ${key}`).toBe(true);
    }
  });

  it("returns null for unknown keys", () => {
    expect(getFeatureImage("not-a-feature")).toBeNull();
  });

  it("returns null for prototype keys like toString", () => {
    expect(getFeatureImage("toString")).toBeNull();
  });
});
