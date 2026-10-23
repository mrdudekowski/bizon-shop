import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArticleLayout } from "./ArticleLayout";

const baseProps = {
  title: "Проверка шины",
  description: "Анонс",
  breadcrumbs: [],
  imageAlt: "Обложка статьи",
  fallbackKey: "article",
  backHref: "/tire-iq/",
  backLabel: "Все статьи",
  children: createElement("p", null, "Текст статьи"),
};

describe("ArticleLayout media", () => {
  it("does not render a fallback image when the CMS explicitly cleared the cover", () => {
    const html = renderToStaticMarkup(createElement(ArticleLayout, { ...baseProps, imageUrl: null }));
    expect(html).toContain("Текст статьи");
    expect(html).not.toContain("<img");
  });

  it("renders the CMS-selected cover", () => {
    const html = renderToStaticMarkup(createElement(ArticleLayout, { ...baseProps, imageUrl: "/media/selected.webp" }));
    expect(html).toContain("url=%2Fmedia%2Fselected.webp");
    expect(html).toContain('alt="Обложка статьи"');
  });
});
