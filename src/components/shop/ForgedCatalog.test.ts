import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ForgedCatalog } from "./ForgedCatalog";

describe("ForgedCatalog CMS content", () => {
  it("renders the published wheel type identity, descriptions, and cover", () => {
    const html = renderToStaticMarkup(createElement(ForgedCatalog, {
      wheelType: {
        slug: "forged",
        name: "Кованые диски",
        description: "Кованые диски для коммерческого транспорта.",
        shortDescription: "Высокопрочные кованые диски",
        sortOrder: 1,
        imageUrl: "/media/forged.webp",
      },
      models: [],
      variants: [],
    }));

    expect(html).toMatch(/<header[\s\S]*Кованые диски<\/h1>[\s\S]*Высокопрочные кованые диски[\s\S]*Кованые диски для коммерческого транспорта\./);
    expect(html).toContain("url=%2Fmedia%2Fforged.webp");
  });
});
