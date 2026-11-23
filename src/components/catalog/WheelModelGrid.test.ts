import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WheelModelGrid } from "./WheelModelGrid";

describe("WheelModelGrid", () => {
  it("explains when there are no published wheel models and no filters are active", () => {
    const html = renderToStaticMarkup(createElement(WheelModelGrid, {
      models: [],
      variants: [],
      typeBasePath: "/wheels/forged/",
    }));

    expect(html).toContain("Модели дисков пока не опубликованы");
    expect(html).toContain("Очистить фильтры");
    expect(html).not.toContain("Не нашли подходящую модель?");
    expect(html).not.toContain("Запросить подбор");
    expect(html).not.toContain("wheel-selection");
  });
});
