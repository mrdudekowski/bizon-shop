import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PageHero } from "./PageHero";

describe("PageHero CMS image focus", () => {
  it("applies stored focal coordinates to the public image", () => {
    const html = renderToStaticMarkup(createElement(PageHero, {
      title: "Брендирование",
      media: { src: "/branding.webp", alt: "", focalX: 0.2, focalY: 0.8 },
    }));
    expect(html).toContain("object-position:20% 80%");
  });
});
