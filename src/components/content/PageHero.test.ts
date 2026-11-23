import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { pageHeroLayoutForPage } from "@/lib/content/pageHeroMediaContract";
import { PageHero } from "./PageHero";

describe("PageHero CMS image focus", () => {
  it("applies stored focal coordinates to the public image", () => {
    const html = renderToStaticMarkup(createElement(PageHero, {
      title: "Брендирование",
      media: { src: "/branding.webp", alt: "", focalX: 0.2, focalY: 0.8 },
    }));
    expect(html).toContain("--focal-desktop:20% 80%");
  });

  it.each([
    { pageKey: "branding", banner: true },
    { pageKey: "delivery-geography", banner: false },
  ])("renders the resolved layout and viewport focal positions for $pageKey", ({ pageKey, banner }) => {
    const html = renderToStaticMarkup(createElement(PageHero, {
      title: "Услуга",
      media: {
        src: "/hero.webp",
        alt: "Изображение услуги",
        focalByViewport: {
          desktop: { x: 0.25, y: 0.75 },
          tablet: { x: 0.5, y: 0.25 },
          mobile: { x: 0.75, y: 0.5 },
        },
      },
      mediaLayout: pageHeroLayoutForPage(pageKey),
    }));

    expect(html.includes('data-layout="banner"')).toBe(banner);
    const headingIndex = html.indexOf("<h1>");
    const imageIndex = html.indexOf("<img ");
    expect(headingIndex).toBeGreaterThanOrEqual(0);
    expect(imageIndex).toBeGreaterThanOrEqual(0);
    expect(imageIndex < headingIndex).toBe(banner);
    expect(html).toContain("--focal-desktop:25% 75%");
    expect(html).toContain("--focal-tablet:50% 25%");
    expect(html).toContain("--focal-mobile:75% 50%");
  });
});
