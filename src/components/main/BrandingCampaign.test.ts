import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { HomeBrandingContent } from "@/lib/content/pages/types";
import { BrandingCampaign } from "./BrandingCampaign";

function collect(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collect).join("");
  if (node && typeof node === "object") return collect((node as { props?: { children?: unknown } }).props?.children);
  return "";
}

function links(node: unknown): { href: string; label: string }[] {
  if (Array.isArray(node)) return node.flatMap(links);
  if (!node || typeof node !== "object") return [];
  const props = (node as { props?: { href?: unknown; children?: unknown } }).props;
  const own = typeof props?.href === "string" ? [{ href: props.href, label: collect(props.children).trim() }] : [];
  return [...own, ...links(props?.children)];
}

function findBrandingCompare(node: unknown): { props?: Record<string, unknown> } | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findBrandingCompare(child);
      if (found) return found;
    }
    return null;
  }
  if (!node || typeof node !== "object") return null;
  const element = node as { type?: { name?: string }; props?: { children?: unknown } };
  if (element.type?.name === "BrandingCompare") return element as { props?: Record<string, unknown> };
  return findBrandingCompare(element.props?.children);
}

describe("BrandingCampaign", () => {
  it.each([
    { beforeImageUrl: null, afterImageUrl: "/images/after.jpg" },
    { beforeImageUrl: "/images/before.jpg", afterImageUrl: null },
    { beforeImageUrl: null, afterImageUrl: null },
  ])("hides incomplete comparison and captions while keeping copy and CTA: %j", (images) => {
    const content: HomeBrandingContent = {
      eyebrow: "Брендирование для автопарка",
      title: "Ваш логотип на шинах",
      lead: "Нанесение под требования заказчика.",
      cta: { label: "Запросить расчёт", href: "/contact?subject=fleet" },
      beforeCaption: "До нанесения",
      afterCaption: "После нанесения",
      beforeImageAlt: "Шина до нанесения",
      afterImageAlt: "Шина с нанесённым логотипом",
      ...images,
    };
    const html = renderToStaticMarkup(createElement(BrandingCampaign, { content }));

    expect(html).not.toContain('type="range"');
    expect(html).not.toContain("До нанесения");
    expect(html).not.toContain("После нанесения");
    expect(html).not.toContain("/images/before.jpg");
    expect(html).not.toContain("/images/after.jpg");
    expect(html).toContain(content.title);
    expect(html).toContain(content.lead);
    expect(html).toContain(content.cta.label);
    expect(html).toContain('href="/contact?subject=fleet"');
  });

  it("renders the published CMS copy and CTA without replacing it with component constants", () => {
    const content: HomeBrandingContent = {
      eyebrow: "Брендирование для автопарка",
      title: "Ваш логотип на шинах",
      lead: "Нанесение под требования заказчика.",
      cta: { label: "Запросить расчёт", href: "/contact?subject=fleet" },
      beforeCaption: "До нанесения",
      afterCaption: "После нанесения",
      beforeImageUrl: "/images/plain-custom.jpg",
      beforeImageAlt: "Шина до нанесения",
      afterImageUrl: "/images/branded-custom.jpg",
      afterImageAlt: "Шина с нанесённым логотипом",
    };
    const element = (BrandingCampaign as unknown as (props: { content: HomeBrandingContent }) => unknown)({ content });

    expect(collect(element)).toContain("Ваш логотип на шинах");
    expect(collect(element)).toContain("Брендирование для автопарка");
    expect(collect(element)).toContain("Нанесение под требования заказчика.");
    expect(links(element)).toEqual([{ href: "/contact?subject=fleet", label: "Запросить расчёт" }]);
    expect(findBrandingCompare(element)?.props).toMatchObject({
      beforeImageUrl: "/images/plain-custom.jpg",
      beforeImageAlt: "Шина до нанесения",
      afterImageUrl: "/images/branded-custom.jpg",
      afterImageAlt: "Шина с нанесённым логотипом",
    });
    expect(collect(element)).toContain("До нанесения");
    expect(collect(element)).toContain("После нанесения");
  });
});
