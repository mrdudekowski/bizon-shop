import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BrandingCompare } from "./BrandingCompare";

describe("BrandingCompare", () => {
  it.each([
    { beforeImageUrl: null, afterImageUrl: "/images/after.jpg" },
    { beforeImageUrl: "/images/before.jpg", afterImageUrl: null },
    { beforeImageUrl: null, afterImageUrl: null },
  ])("renders nothing when either comparison side is absent: %j", (images) => {
    expect(renderToStaticMarkup(createElement(BrandingCompare, {
      ...images,
      beforeImageAlt: "До нанесения",
      afterImageAlt: "После нанесения",
    }))).toBe("");
  });

  it("renders both images and the slider when both sides exist", () => {
    const html = renderToStaticMarkup(createElement(BrandingCompare, {
      beforeImageUrl: "/images/before.jpg",
      afterImageUrl: "/images/after.jpg",
      beforeImageAlt: "До нанесения",
      afterImageAlt: "После нанесения",
    }));

    expect(html).toContain('type="range"');
    expect(html).toContain('alt="До нанесения"');
    expect(html).toContain('alt="После нанесения"');
  });
});
