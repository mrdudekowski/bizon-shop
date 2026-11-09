import { describe, expect, it } from "vitest";

import { PLACEHOLDER_SITE_PROFILE } from "@/lib/content/siteProfile";
import {
  createArticleStructuredData,
  createBreadcrumbStructuredData,
  createOrganizationStructuredData,
  createProductStructuredData,
  jsonLdScriptContent,
  shopProductBreadcrumbs,
  singleVariantOffer,
  tireIqBreadcrumbs,
  wheelModelBreadcrumbs,
  visibleProductOffer,
} from "./structuredData";

describe("createOrganizationStructuredData", () => {
  it("omits the contact point while phone and email are placeholder sentences", () => {
    const data = createOrganizationStructuredData(PLACEHOLDER_SITE_PROFILE);
    expect(data).not.toHaveProperty("contactPoint");
    expect(data.url).toMatch(/\/$/);
  });

  it("publishes only the contact values that are real", () => {
    const { contactPoint } = createOrganizationStructuredData({
      phone: PLACEHOLDER_SITE_PROFILE.phone,
      email: "sales@bizon.ru",
    }) as { contactPoint: Record<string, unknown> };

    expect(contactPoint.email).toBe("sales@bizon.ru");
    expect(contactPoint).not.toHaveProperty("telephone");
  });
});

describe("jsonLdScriptContent", () => {
  it("encodes angle brackets so a catalog name cannot close the script element", () => {
    const html = jsonLdScriptContent(createProductStructuredData({
      name: "</script>",
      path: "/shop/product/x",
    }));

    expect(html).not.toContain("</");
    expect(html).toContain("\\u003c");
  });
});

describe("createProductStructuredData", () => {
  it("uses a trailing-slash canonical and omits an empty description", () => {
    const data = createProductStructuredData({
      name: "Мега прицеп",
      description: " ",
      path: "/shop/product/mega-pritsep",
      brand: " ",
    });

    expect(data.url).toMatch(/\/shop\/product\/mega-pritsep\/$/);
    expect(data).not.toHaveProperty("description");
    expect(data.brand).toEqual({ "@type": "Brand", name: "BIZON" });
    expect(data).not.toHaveProperty("offers");
    expect(data).not.toHaveProperty("image");
  });

  it("publishes the image and sku the product page already shows", () => {
    const data = createProductStructuredData({
      name: "Мега прицеп",
      path: "/shop/product/mega-pritsep",
      image: "/catalog/mega+pritsep.png",
      sku: "MP-1",
    });

    expect(data.image).toMatch(/\/catalog\/mega%2Bpritsep\.png$/);
    expect(data.sku).toBe("MP-1");
  });

  it("adds a ruble offer only when the page shows a numeric price", () => {
    const withPrice = createProductStructuredData({
      name: "Диск",
      path: "/shop/wheels/forged/atlas",
      offer: visibleProductOffer(120000, false, true),
    });
    const onRequest = createProductStructuredData({
      name: "Диск",
      path: "/shop/wheels/forged/atlas",
      offer: visibleProductOffer(undefined, true, true),
    });

    expect(withPrice.offers).toMatchObject({
      price: 120000,
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
    });
    expect(onRequest).not.toHaveProperty("offers");
  });
});

describe("singleVariantOffer", () => {
  const priced = { price: 50000, priceOnRequest: false, available: true };

  it("uses the only selected variant", () => {
    expect(singleVariantOffer([priced], true)).toEqual({ price: 50000, available: true });
  });

  it("stays empty when the buyer has not selected among several variants", () => {
    expect(singleVariantOffer([priced, { ...priced, price: 60000 }], true)).toBeUndefined();
  });

  it("stays empty when the only variant is priced on request", () => {
    expect(singleVariantOffer([{ price: 50000, priceOnRequest: true, available: true }], true)).toBeUndefined();
  });
});

describe("createArticleStructuredData", () => {
  it("publishes the visible date and skips an unparseable one", () => {
    const dated = createArticleStructuredData({
      title: "Ось",
      excerpt: "Как выбрать",
      path: "/tire-iq/axle",
      publishedAt: "2026-01-01",
    });
    const undated = createArticleStructuredData({
      title: "Ось",
      excerpt: " ",
      path: "/tire-iq/axle",
      publishedAt: "позже",
    });

    expect(dated.datePublished).toBe("2026-01-01");
    expect(dated.mainEntityOfPage).toMatch(/\/tire-iq\/axle\/$/);
    expect(undated).not.toHaveProperty("datePublished");
    expect(undated).not.toHaveProperty("description");
    expect(dated.publisher).toMatchObject({ "@type": "Organization", name: "Bizon Tires" });
    expect(dated.publisher.url).toMatch(/\/$/);
  });
});

describe("createBreadcrumbStructuredData", () => {
  it("numbers the same crumbs the article renders", () => {
    const data = createBreadcrumbStructuredData(tireIqBreadcrumbs({ slug: "axle", title: "Ось" }));

    expect(data.itemListElement.map((item) => item.name)).toEqual(["Главная", "Tire IQ", "Ось"]);
    expect(data.itemListElement[2].item).toMatch(/\/tire-iq\/axle\/$/);
  });

  it("matches the shop product and wheel crumbs already on the page", () => {
    expect(shopProductBreadcrumbs({ categorySlug: "pritsepy" }).map((crumb) => crumb.label)).toEqual([
      "Shop",
      "pritsepy",
    ]);
    expect(wheelModelBreadcrumbs({
      typeSlug: "forged",
      typeName: "Кованые",
      modelPath: "/shop/wheels/forged/atlas",
      modelName: "Atlas",
    }).map((crumb) => crumb.label)).toEqual(["Главная", "Магазин", "Кованые", "Atlas"]);
  });
});
