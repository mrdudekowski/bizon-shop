import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EditorialListing } from "./EditorialListing";

describe("EditorialListing media", () => {
  it("hides a cover only when the published article explicitly cleared it", () => {
    const html = renderToStaticMarkup(createElement(EditorialListing, {
      title: "Tire IQ",
      breadcrumbs: [],
      items: [{
        key: "article",
        href: "/tire-iq/article/",
        title: "Статья",
        imageUrl: null,
        showImage: false,
      }],
    }));
    expect(html).toContain("Статья");
    expect(html).not.toContain("<img");
  });

  it("renders a system fallback supplied for a legacy article", () => {
    const html = renderToStaticMarkup(createElement(EditorialListing, {
      title: "Tire IQ",
      breadcrumbs: [],
      items: [{
        key: "article",
        href: "/tire-iq/article/",
        title: "Статья",
        imageUrl: "/images/tire-iq/production/VIS-21-contact-optimal-web.webp",
        showImage: true,
      }],
    }));
    expect(html).toContain("url=%2Fimages%2Ftire-iq%2Fproduction%2FVIS-21-contact-optimal-web.webp");
  });
});
