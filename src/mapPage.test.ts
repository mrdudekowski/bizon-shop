import { describe, expect, it } from "vitest";
import { mapHomePatch, mapShopHomePatch } from "./mapPage";

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

  it("maps a public hero image and drops data urls", () => {
    expect(
      mapHomePatch({
        seo_seo_title: "",
        seo_seo_description: "",
        home_hero_eyebrow: "",
        home_hero_title: "Для работы",
        home_hero_lead: "",
        home_hero_primary_cta_label: "",
        home_hero_primary_cta_href: "",
        home_hero_secondary_cta_label: "",
        home_hero_secondary_cta_href: "",
        home_hero_metric_label: "",
        home_hero_metric_text: "",
        home_hero_image_url: "/media/hero.jpg",
      }).hero.imageUrl,
    ).toBe("/media/hero.jpg");

    expect(
      mapHomePatch({
        seo_seo_title: "",
        seo_seo_description: "",
        home_hero_eyebrow: "",
        home_hero_title: "",
        home_hero_lead: "",
        home_hero_primary_cta_label: "",
        home_hero_primary_cta_href: "",
        home_hero_secondary_cta_label: "",
        home_hero_secondary_cta_href: "",
        home_hero_metric_label: "",
        home_hero_metric_text: "",
        home_hero_image_url: "data:image/png;base64,abc",
      }).hero.imageUrl,
    ).toBeUndefined();
  });

  it("maps a public shop campaign image", () => {
    expect(
      mapHomePatch({
        seo_seo_title: "",
        seo_seo_description: "",
        home_hero_eyebrow: "",
        home_hero_title: "",
        home_hero_lead: "",
        home_hero_primary_cta_label: "",
        home_hero_primary_cta_href: "",
        home_hero_secondary_cta_label: "",
        home_hero_secondary_cta_href: "",
        home_hero_metric_label: "",
        home_hero_metric_text: "",
        home_shop_campaign_image_url: "https://s3.twcstorage.ru/bucket/bizon/media/uuid.png",
        home_shop_campaign_image_alt: "Магазин",
      }).shopCampaign,
    ).toEqual({
      imageUrl: "https://s3.twcstorage.ru/bucket/bizon/media/uuid.png",
      imageAlt: "Магазин",
    });
  });
});

const emptyShopHomeRow = {
  seo_seo_title: "",
  seo_seo_description: "",
  shop_hero_eyebrow: "",
  shop_hero_title: "Shop",
  shop_hero_lead: "",
  shop_hero_cta_label: "",
  shop_hero_cta_href: "",
  shop_hero_image_alt: "",
};

describe("mapShopHomePatch", () => {
  it("maps a public shop hero image", () => {
    expect(
      mapShopHomePatch({
        row: {
          ...emptyShopHomeRow,
          shop_hero_image_url: "https://s3.twcstorage.ru/bucket/bizon/media/hero.png",
          shop_hero_image_alt: "Hero",
        },
        carousel: [],
        vehicles: [],
        orderSteps: [],
      }).hero.imageUrl,
    ).toBe("https://s3.twcstorage.ru/bucket/bizon/media/hero.png");
  });

  it("maps wheels intro, order steps and vehicle shell so the site can leave defaults behind", () => {
    expect(
      mapShopHomePatch({
        row: {
          ...emptyShopHomeRow,
          shop_wheels_intro_kicker: "BIZON Forged",
          shop_wheels_intro_title: "Выберите свой дизайн",
          shop_wheels_intro_lead: "Под заказ",
          shop_vehicles_eyebrow: "BIZON Forged",
          shop_vehicles_title: "Созданы менять характер",
          shop_vehicles_cta_label: "Выбрать диски",
          shop_vehicles_cta_href: "#wheels",
        },
        carousel: [
          {
            id: "acc",
            kicker: "Accessories",
            title: "Детали для движения",
            action: "Открыть Accessories",
            href: "/shop/accessories",
            desktop_image_url: "/images/acc.png",
            alt: "Acc",
          },
        ],
        vehicles: [{ title: "Rubicon · Nomad", image_url: "/images/rubicon.png", alt: "Rubicon" }],
        orderSteps: [{ title: "Выберите дизайн", description: "Посмотрите модели." }],
      }),
    ).toMatchObject({
      wheelsIntro: {
        kicker: "BIZON Forged",
        title: "Выберите свой дизайн",
        lead: "Под заказ",
      },
      orderSteps: [{ title: "Выберите дизайн", description: "Посмотрите модели." }],
      categoryCarousel: [
        {
          id: "acc",
          kicker: "Accessories",
          title: "Детали для движения",
          href: "/shop/accessories",
          desktopImage: "/images/acc.png",
        },
      ],
      vehicles: {
        eyebrow: "BIZON Forged",
        title: "Созданы менять характер",
        cta: { label: "Выбрать диски", href: "#wheels" },
        slides: [{ title: "Rubicon · Nomad", image: "/images/rubicon.png", alt: "Rubicon" }],
      },
    });
  });
});
