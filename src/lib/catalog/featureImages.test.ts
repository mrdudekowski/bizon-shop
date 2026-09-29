import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { TIRE_PERFORMANCE_FEATURE_OPTIONS } from "@/lib/catalog/catalogFieldConstants";
import { FEATURE_IMAGE_KEYS, getFeatureIcon, getFeatureImage, resolveAdvantageIcons } from "./featureImages";

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

  it("resolves CMS glyph icons separately from carousel photos", () => {
    for (const key of FEATURE_IMAGE_KEYS) {
      const icon = getFeatureIcon(key);
      expect(icon).not.toBeNull();
      expect(icon!.src).toBe(`/images/catalog/feature-icons/${key}.png`);
      expect(existsSync(join(process.cwd(), "public", "images", "catalog", "feature-icons", `${key}.png`))).toBe(
        true,
      );
    }
  });

  it("returns null for unknown keys", () => {
    expect(getFeatureImage("not-a-feature")).toBeNull();
  });

  it("returns null for prototype keys like toString", () => {
    expect(getFeatureImage("toString")).toBeNull();
  });

  it("maps CMS advantage keys to public feature images", () => {
    expect(
      resolveAdvantageIcons([
        { key: "anti-tear", title: "Стойкость к разрывам" },
        { key: "not-a-feature", title: "Unknown" },
        { key: "economy" },
      ]),
    ).toEqual([
      {
        key: "anti-tear",
        src: "/images/catalog/feature-icons/anti-tear.png",
        label: "Стойкость к разрывам",
      },
      {
        key: "economy",
        src: "/images/catalog/feature-icons/economy.png",
        label: "Экономичность",
      },
    ]);
  });

  it("matches a CMS title when the stored key is missing", () => {
    expect(resolveAdvantageIcons([{ key: "", title: "Стойкость к разрывам" }])).toEqual([
      {
        key: "anti-tear",
        src: "/images/catalog/feature-icons/anti-tear.png",
        label: "Стойкость к разрывам",
      },
    ]);
  });
});
