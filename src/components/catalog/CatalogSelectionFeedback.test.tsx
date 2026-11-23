// @vitest-environment happy-dom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/models/urban" }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => createElement("a", { href }, children) }));

import { CatalogSelectionFeedback } from "./CatalogSelectionFeedback";

describe("CatalogSelectionFeedback", () => {
  it("shows the approved copy and a form with a required phone", () => {
    const html = renderToStaticMarkup(createElement(CatalogSelectionFeedback, {
      kind: "tire",
      filters: [{ label: "Типоразмер", value: "315/80R22.5" }],
    }));

    expect(html).toContain("Не нашли подходящую модель?");
    expect(html).toContain("Оставьте свои контакты, и наш менеджер свяжется с вами, чтобы помочь с подбором.");
    expect(html).toContain('name="phone"');
    expect(html).toContain('name="email"');
  });
});
