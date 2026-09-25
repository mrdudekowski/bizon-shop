import { describe, expect, it } from "vitest";
import { mapHomePatch } from "./mapPage";

describe("mapHomePatch", () => {
  it("omits empty home strings so the site keeps its defaults", () => {
    expect(
      mapHomePatch({
        seo_seo_title: "",
        seo_seo_description: "",
        home_hero_eyebrow: "",
        home_hero_title: "",
        home_hero_lead: "",
        home_hero_primary_cta_label: "",
        home_hero_primary_cta_href: "",
        home_hero_secondary_cta_label: "Каталог",
        home_hero_secondary_cta_href: "",
        home_hero_metric_label: "",
        home_hero_metric_text: "",
      }),
    ).toEqual({
      hero: {
        secondaryCta: { label: "Каталог" },
      },
    });
  });

  it("maps filled home values without a hero image", () => {
    expect(
      mapHomePatch({
        seo_seo_title: "Шины BIZON",
        seo_seo_description: "Коммерческие шины",
        home_hero_eyebrow: "BIZON",
        home_hero_title: "Для работы",
        home_hero_lead: "Надёжность",
        home_hero_primary_cta_label: "Выбрать",
        home_hero_primary_cta_href: "/models",
        home_hero_secondary_cta_label: "О компании",
        home_hero_secondary_cta_href: "/about",
        home_hero_metric_label: "лет",
        home_hero_metric_text: "10",
        home_hero_image_id: 12,
      }),
    ).toEqual({
      seoTitle: "Шины BIZON",
      seoDescription: "Коммерческие шины",
      hero: {
        eyebrow: "BIZON",
        title: "Для работы",
        lead: "Надёжность",
        primaryCta: { label: "Выбрать", href: "/models" },
        secondaryCta: { label: "О компании", href: "/about" },
        metricLabel: "лет",
        metricText: "10",
      },
    });
  });
});
