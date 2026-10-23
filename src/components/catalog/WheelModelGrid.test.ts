import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WheelModelGrid } from "./WheelModelGrid";

describe("WheelModelGrid", () => {
  it("keeps the empty filter result state inside the catalog instead of offering wheel selection", () => {
    const html = renderToStaticMarkup(createElement(WheelModelGrid, {
      models: [],
      variants: [],
      typeBasePath: "/wheels/forged/",
    }));

    expect(html).toContain("По заданным параметрам диски не найдены");
    expect(html).toContain('href="/wheels/forged"');
    expect(html).not.toContain("Запросить подбор");
    expect(html).not.toContain("wheel-selection");
  });
});
