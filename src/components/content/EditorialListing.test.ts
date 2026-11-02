import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EditorialListing, type EditorialListingItem } from "./EditorialListing";
import styles from "./EditorialListing.module.css";

const axleArticle: EditorialListingItem = {
  key: "axle-role",
  href: "/tire-iq/axle-role-in-tire-selection/",
  title: "Роль оси",
  taxonomy: ["axles"],
};

const pressureArticle: EditorialListingItem = {
  key: "pressure",
  href: "/tire-iq/fleet-pressure-log-method/",
  title: "Журнал давления",
  taxonomy: ["pressure"],
};

function renderListing(items: EditorialListingItem[], activeTopic?: string) {
  return renderToStaticMarkup(createElement(EditorialListing, {
    title: "Tire IQ",
    breadcrumbs: [],
    items,
    activeTopic,
  }));
}

function articleTag(html: string, title: string) {
  const articles = [...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g)];
  const article = articles.find((match) => match[2].includes(title));
  expect(article, title).toBeTruthy();
  return article![1];
}

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

describe("EditorialListing topic", () => {
  it("rendersOnlyArticlesMatchingTheSelectedTopic", () => {
    const html = renderListing([axleArticle, pressureArticle], "axles");

    expect(articleTag(html, "Роль оси")).not.toMatch(/\shidden(?:=|"|\s|>)/);
    expect(articleTag(html, "Журнал давления")).toMatch(/\shidden(?:=|"|\s|>)/);
    expect(html).toContain("Роль оси");
    expect(html).toContain("Журнал давления");
  });

  it("marksTheSelectedTopicInVisualAndAriaState", () => {
    const html = renderListing([axleArticle, pressureArticle], "axles");
    const axlesChip = html.match(/<a\b([^>]*data-topic-filter="axles"[^>]*)>/);
    const allTopicsChip = html.match(/<a\b([^>]*data-topic-filter=""[^>]*)>/);

    expect(axlesChip).not.toBeNull();
    expect(allTopicsChip).not.toBeNull();
    expect(axlesChip![1]).toContain('aria-current="page"');
    expect(axlesChip![1]).toContain(styles.taxonomyLinkActive);
    expect(allTopicsChip![1]).not.toContain('aria-current="page"');
    expect(allTopicsChip![1]).not.toContain(styles.taxonomyLinkActive);
    expect(allTopicsChip![1]).toContain(styles.taxonomyLink);
  });

  it("fills the card track for a coverless article and an empty topic at a narrow width", () => {
    const coverless = renderListing([{
      ...axleArticle,
      imageUrl: null,
      showImage: false,
    }], "axles");
    const emptyTopic = renderListing([pressureArticle], "axles");
    const emptyListing = renderListing([]);
    const listingCss = readFileSync(new URL("./EditorialListing.module.css", import.meta.url), "utf8");
    const mobileCss = listingCss.split("@media (max-width: 767px)")[1] ?? "";

    expect(coverless).toContain("Роль оси");
    expect(coverless).not.toContain("<img");
    expect(articleTag(coverless, "Роль оси")).toContain(styles.coverless);
    expect(mobileCss).toMatch(/\.coverless[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);

    const noResults = emptyTopic.match(/<p\b[^>]*>/g)?.find((tag) => tag.includes("data-editorial-no-results"));
    expect(emptyTopic).toContain("По выбранной теме материалов пока нет.");
    expect(noResults).toBeTruthy();
    expect(noResults).not.toMatch(/\shidden(?:=|"|\s|>)/);
    expect(articleTag(emptyTopic, "Журнал давления")).toMatch(/\shidden(?:=|"|\s|>)/);
    expect(emptyListing).toContain("Опубликованных материалов пока нет.");
    expect(listingCss).toMatch(/\.empty\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });
});
