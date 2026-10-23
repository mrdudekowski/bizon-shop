import { describe, expect, it } from "vitest";

import { ShopCampaign } from "./ShopCampaign";
import { TireDirectionShowcase } from "./TireDirectionShowcase";
import { EditorialHighlights } from "./EditorialHighlights";

function collectText(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectText).join(" ");
  if (node && typeof node === "object") {
    return collectText((node as { props?: { children?: unknown } }).props?.children);
  }
  return "";
}

describe("CMS driven home sections", () => {
  it("shows the configured Directions eyebrow, title, and lead", () => {
    const element = TireDirectionShowcase({
      catalog: null,
      content: {
        eyebrow: "ПОДБОР ПО ЗАДАЧЕ",
        title: "Подходящие шины",
        lead: "Для вашего маршрута",
      },
    });

    const text = collectText(element);
    expect(text).toContain("ПОДБОР ПО ЗАДАЧЕ");
    expect(text).toContain("Подходящие шины");
    expect(text).toContain("Для вашего маршрута");
  });

  it("shows the configured Shop campaign copy and CTA", () => {
    const element = ShopCampaign({
      content: {
        eyebrow: "BIZON SHOP",
        title: "Кованые диски",
        lead: "Созданы для вашей техники",
        imageUrl: "/media/wheel.jpg",
        imageAlt: "Диск BIZON",
        cta: { label: "Выбрать диск", href: "/shop" },
      },
    });

    const text = collectText(element);
    expect(text).toContain("BIZON SHOP");
    expect(text).toContain("Кованые диски");
    expect(text).toContain("Созданы для вашей техники");
    expect(text).toContain("Выбрать диск");
  });

  it("uses the configured Expertise image and CTA", () => {
    const element = EditorialHighlights({
      content: {
        eyebrow: "Практика",
        title: "Инженерная поддержка",
        lead: "Описание раздела",
        imageUrl: "https://cdn.example.test/expertise.jpg",
        imageAlt: "Измерение протектора",
        cta: { label: "Читать", href: "/tire-iq" },
      },
    });

    const imageSources = collectProperty(element, "src");
    const links = collectProperty(element, "href");
    expect(collectText(element)).toContain("Практика");
    expect(imageSources).toContain("https://cdn.example.test/expertise.jpg");
    expect(links).toContain("/tire-iq");
  });
});

function collectProperty(node: unknown, property: "src" | "href"): string[] {
  if (Array.isArray(node)) return node.flatMap((child) => collectProperty(child, property));
  if (!node || typeof node !== "object") return [];
  const element = node as { props?: Record<string, unknown> };
  const value = element.props?.[property];
  return [
    ...(typeof value === "string" ? [value] : []),
    ...collectProperty(element.props?.children, property),
  ];
}
