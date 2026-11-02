import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import SelectionPage from "./page";

describe("selection page", () => {
  it("shows /models as the visible destination", () => {
    const html = renderToStaticMarkup(createElement(SelectionPage));
    expect(html).toContain('href="/models"');
    expect(html).not.toContain("NEXT_REDIRECT");
    expect(html).not.toMatch(/<meta\b/i);
  });
});
