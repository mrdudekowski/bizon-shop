import { describe, expect, it } from "vitest";
import { mapHomePatch, mapShopHomePatch, mapStubPatch, publishedShopCampaignFrames } from "./mapPage";

describe("mapStubPatch", () => {
  it("keeps explicitly cleared hero fields empty after CMS takes ownership", () => {
    expect(mapStubPatch({
      stub_hero_configured: true,
      stub_hero_eyebrow: "",
      stub_hero_title: "",
      stub_hero_lead: "",
      stub_hero_image_url: null,
      stub_hero_image_alt: "",
      seo_seo_title: null,
      seo_seo_description: null,
    })).toEqual({
      hero: { eyebrow: "", title: "", lead: "", imageUrl: null, imageAlt: "" },
    });
  });

  it("preserves legacy defaults for a page not yet configured in CMS", () => {
    expect(mapStubPatch({
      stub_hero_configured: false,
      stub_hero_eyebrow: null,
      stub_hero_title: null,
      stub_hero_lead: null,
      stub_hero_image_url: null,
      stub_hero_image_alt: null,
      seo_seo_title: null,
      seo_seo_description: null,
    })).toEqual({ hero: {} });
  });

  it("preserves explicitly cleared SEO fields while legacy null stays absent", () => {
    expect(mapStubPatch({
      stub_hero_configured: true,
      stub_hero_eyebrow: "",
      stub_hero_title: "",
      stub_hero_lead: "",
      stub_hero_image_url: null,
      stub_hero_image_alt: "",
      seo_seo_title: "",
      seo_seo_description: "",
    })).toMatchObject({ seoTitle: "", seoDescription: "" });

    expect(mapStubPatch({
      stub_hero_configured: false,
      stub_hero_eyebrow: null,
      stub_hero_title: null,
      stub_hero_lead: null,
      stub_hero_image_url: null,
      stub_hero_image_alt: null,
      seo_seo_title: null,
      seo_seo_description: null,
    })).not.toHaveProperty("seoTitle");
  });

  it("preserves configured empty editorial lists and clear operations", () => {
    expect(mapStubPatch({
      editorial_configured: true,
      editorial_heading_configured: true,
      editorial_features_configured: true,
      editorial_sections_configured: true,
      editorial_notice_configured: true,
      editorial_proof_configured: true,
      editorial_cta_configured: true,
      editorial_features_heading: "",
      editorial_notice: "",
      editorial_proof_title: "",
      editorial_proof_text: "",
      editorial_proof_image_url: null,
      editorial_cta_label: "",
      editorial_cta_href: "",
      features: [],
      sections: [],
      seo_seo_title: null,
      seo_seo_description: null,
      stub_hero_eyebrow: null,
      stub_hero_title: null,
      stub_hero_lead: null,
      stub_hero_image_alt: null,
    })).toMatchObject({
      featuresHeading: "",
      features: [],
      sections: [],
      notice: null,
      proof: null,
      cta: null,
    });
  });
});

describe("mapHomePatch", () => {
  it("preserves explicit empty branding copy and cleared comparison images", () => {
    expect(mapHomePatch({
      seo_seo_title: null,
      seo_seo_description: null,
      home_hero_eyebrow: null,
      home_hero_title: null,
      home_hero_lead: null,
      home_hero_primary_cta_label: null,
      home_hero_primary_cta_href: null,
      home_hero_secondary_cta_label: null,
      home_hero_secondary_cta_href: null,
      home_hero_metric_label: null,
      home_hero_metric_text: null,
      home_branding_eyebrow: "",
      home_branding_title: "",
      home_branding_lead: "",
      home_branding_cta_label: "",
      home_branding_cta_href: "",
      home_branding_before_caption: "",
      home_branding_after_caption: "",
      home_branding_before_image_url: null,
      home_branding_before_image_alt: "",
      home_branding_after_image_url: null,
      home_branding_after_image_alt: "",
    }).branding).toEqual({
      eyebrow: "",
      title: "",
      lead: "",
      cta: { label: "", href: "" },
      beforeCaption: "",
      afterCaption: "",
      beforeImageUrl: null,
      beforeImageAlt: "",
      afterImageUrl: null,
      afterImageAlt: "",
    });
  });
  it("omits legacy NULL home strings so the site keeps its defaults", () => {
    expect(
      mapHomePatch({
        seo_seo_title: null,
        seo_seo_description: null,
        home_hero_eyebrow: null,
        home_hero_title: null,
        home_hero_lead: null,
        home_hero_primary_cta_label: null,
        home_hero_primary_cta_href: null,
        home_hero_secondary_cta_label: "Каталог",
        home_hero_secondary_cta_href: null,
        home_hero_metric_label: null,
        home_hero_metric_text: null,
      }),
    ).toEqual({
      hero: {
        secondaryCta: { label: "Каталог" },
      },
    });
  });

  it("preserves explicit empty values and an explicitly cleared hero image", () => {
    expect(mapHomePatch({
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
      home_hero_image_url: null,
      home_hero_image_alt: "",
    })).toEqual({
      seoTitle: "",
      seoDescription: "",
      hero: {
        eyebrow: "",
        title: "",
        lead: "",
        primaryCta: { label: "", href: "" },
        secondaryCta: { label: "", href: "" },
        metricLabel: "",
        metricText: "",
        imageUrl: null,
        imageAlt: "",
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

  it("maps a public hero image and rejects data urls without a fallback", () => {
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
    ).toBeNull();
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

  it("resolves campaign frames from the saved CMS placements", () => {
    expect(publishedShopCampaignFrames({
      shopCampaign: {
        frames: [
          { assetId: "12", alt: "Первый", focalX: 0.2, focalY: 0.8 },
          { assetId: "missing", alt: "Нет файла" },
          { assetId: "13", alt: "Второй" },
        ],
      },
    }, new Map([
      ["12", "/one.png"],
      ["13", "/two.png"],
    ]))).toEqual([
      { imageUrl: "/one.png", imageAlt: "Первый", imageFocalX: 0.2, imageFocalY: 0.8 },
      { imageUrl: "/two.png", imageAlt: "Второй" },
    ]);
  });

  it("preserves empty Shop campaign fields and an explicitly cleared image", () => {
    expect(mapHomePatch({
      seo_seo_title: null,
      seo_seo_description: null,
      home_hero_eyebrow: null,
      home_hero_title: null,
      home_hero_lead: null,
      home_hero_primary_cta_label: null,
      home_hero_primary_cta_href: null,
      home_hero_secondary_cta_label: null,
      home_hero_secondary_cta_href: null,
      home_hero_metric_label: null,
      home_hero_metric_text: null,
      home_shop_campaign_eyebrow: "",
      home_shop_campaign_title: "",
      home_shop_campaign_lead: "",
      home_shop_campaign_image_url: null,
      home_shop_campaign_image_alt: "",
      home_shop_campaign_cta_label: "",
      home_shop_campaign_cta_href: "",
    }).shopCampaign).toEqual({
      eyebrow: "",
      title: "",
      lead: "",
      imageUrl: null,
      imageAlt: "",
      cta: { label: "", href: "" },
    });
  });

  it("maps directions and expertise so the site can leave defaults behind", () => {
    expect(
      mapHomePatch({
        seo_seo_title: "",
        seo_seo_description: "",
        home_hero_eyebrow: "",
        home_hero_title: "Шины",
        home_hero_lead: "",
        home_hero_primary_cta_label: "",
        home_hero_primary_cta_href: "",
        home_hero_secondary_cta_label: "",
        home_hero_secondary_cta_href: "",
        home_hero_metric_label: "",
        home_hero_metric_text: "",
        home_directions_title: "Шины под рабочую среду",
        home_directions_lead: "Каждое направление уже содержит модели.",
        home_expertise_title: "Экспертиза и поддержка",
        home_expertise_eyebrow: "Практика",
      }),
    ).toMatchObject({
      directions: {
        title: "Шины под рабочую среду",
        lead: "Каждое направление уже содержит модели.",
      },
      expertise: {
        eyebrow: "Практика",
        title: "Экспертиза и поддержка",
      },
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
  shop_catalog_eyebrow: "",
  shop_catalog_title: "",
  shop_catalog_lead: "",
  shop_catalog_section_title: "",
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

  it("preserves explicit empty shop copy, empty CTAs, and a cleared image", () => {
    const mapped = mapShopHomePatch({
      row: {
        ...emptyShopHomeRow,
        shop_hero_title: "",
        shop_hero_image_url: null,
      },
      carousel: [],
      vehicles: [],
      orderSteps: [],
    });

    expect(mapped.hero).toMatchObject({
      title: "",
      imageUrl: null,
      cta: { label: "", href: "" },
    });
  });

  it("maps catalog page copy and tile routes from the selected category", () => {
    expect(
      mapShopHomePatch({
        row: {
          ...emptyShopHomeRow,
          shop_catalog_eyebrow: "Shop",
          shop_catalog_title: "Дорожные вещи",
          shop_catalog_lead: "Подберите товары для поездки.",
          shop_catalog_section_title: "Направления",
        },
        carousel: [],
        vehicles: [],
        orderSteps: [],
        catalogTiles: [
          {
            category_id: 5,
            category_slug: "outdoor",
            title: "Кемпинг",
            visible: true,
            sort_order: 3,
            icon_url: "/media/outdoor-icon.png",
            image_url: "/media/outdoor-card.png",
            carousel_image_url: "/media/outdoor-carousel.png",
            carousel_visible: true,
            icon_alt: "Кемпинг",
            image_alt: "Товары для кемпинга",
          },
        ],
      }),
    ).toMatchObject({
      catalog: {
        copy: {
          eyebrow: "Shop",
          title: "Дорожные вещи",
          lead: "Подберите товары для поездки.",
          sectionTitle: "Направления",
        },
        tiles: [
          {
            categoryId: "5",
            categorySlug: "outdoor",
            title: "Кемпинг",
            visible: true,
            sortOrder: 3,
            iconUrl: "/media/outdoor-icon.png",
            imageUrl: "/media/outdoor-card.png",
            carouselImageUrl: "/media/outdoor-carousel.png",
            carouselVisible: true,
          },
        ],
      },
    });
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
describe("published focal point mapping", () => {
  it("includes CMS focal coordinates for the page hero and proof image", () => {
    const result = mapStubPatch({
      stub_hero_configured: true,
      stub_hero_eyebrow: "",
      stub_hero_title: "",
      stub_hero_lead: "",
      stub_hero_image_url: "/branding.webp",
      stub_hero_image_alt: "",
      stub_hero_image_focal_x: 0.2,
      stub_hero_image_focal_y: 0.8,
      editorial_configured: true,
      editorial_proof_configured: true,
      editorial_proof_title: "Proof",
      editorial_proof_text: "",
      editorial_proof_image_url: "/proof.webp",
      editorial_proof_image_alt: "",
      editorial_proof_image_focal_x: 0.3,
      editorial_proof_image_focal_y: 0.7,
      seo_seo_title: null,
      seo_seo_description: null,
    });
    expect(result.hero).toMatchObject({ imageFocalX: 0.2, imageFocalY: 0.8 });
    expect(result.proof).toMatchObject({ imageFocalX: 0.3, imageFocalY: 0.7 });
  });
});
