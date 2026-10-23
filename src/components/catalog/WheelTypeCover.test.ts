import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WheelTypeCover } from "./WheelTypeCover";

describe("WheelTypeCover", () => {
  it("renders the published CMS image with useful alt text", () => {
    const html = renderToStaticMarkup(createElement(WheelTypeCover, {
      imageUrl: "/media/wheel-type.webp",
      name: "Кованые диски",
    }));

    expect(html).toContain("url=%2Fmedia%2Fwheel-type.webp");
    expect(html).toContain('alt="Кованые диски"');
  });

  it("does not render an empty cover", () => {
    expect(renderToStaticMarkup(createElement(WheelTypeCover, { imageUrl: null, name: "Кованые диски" })))
      .toBe("");
  });
});
