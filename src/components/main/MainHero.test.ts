import { describe, expect, it } from "vitest";

import { MainHero } from "./MainHero";

function findHeadingText(node: unknown): string | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const text = findHeadingText(child);
      if (text !== null) return text;
    }
    return null;
  }
  if (node === null || typeof node !== "object") return null;
  const element = node as { type?: unknown; props?: { children?: unknown } };
  if (element.type === "h1") return collectText(element.props?.children);
  return findHeadingText(element.props?.children);
}

function collectText(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectText).join("");
  if (node && typeof node === "object") {
    return collectText((node as { props?: { children?: unknown } }).props?.children);
  }
  return "";
}

function findLinks(node: unknown): { href: string; label: string }[] {
  if (Array.isArray(node)) return node.flatMap(findLinks);
  if (!node || typeof node !== "object") return [];
  const element = node as { props?: { href?: unknown; children?: unknown } };
  const ownLink = typeof element.props?.href === "string"
    ? [{ href: element.props.href, label: collectText(element.props.children) }]
    : [];
  return [...ownLink, ...findLinks(element.props?.children)];
}

function findImageSources(node: unknown): string[] {
  if (Array.isArray(node)) return node.flatMap(findImageSources);
  if (!node || typeof node !== "object") return [];
  const element = node as { props?: { src?: unknown; children?: unknown } };
  const ownImage = typeof element.props?.src === "string" ? [element.props.src] : [];
  return [...ownImage, ...findImageSources(element.props?.children)];
}

describe("MainHero", () => {
  it("renders the published CMS title without rewriting its words", () => {
    const element = MainHero({
      content: {
        eyebrow: "ШИНЫ BIZON · КОММЕРЧЕСКИЙ ТРАНСПОРТ",
        title: "Шины для ваших задач",
        lead: "Для маршрутов любой сложности",
        imageUrl: "",
        imageAlt: "",
        primaryCta: { label: "Подобрать шины", href: "/selection" },
        secondaryCta: { label: "Изучить каталог", href: "/models" },
        metricLabel: "",
        metricText: "",
      },
    });

    expect(findHeadingText(element)).toBe("Шины для ваших задач");
  });

  it("renders both CMS calls to action and the configured metric", () => {
    const element = MainHero({
      content: {
        eyebrow: "BIZON",
        title: "Шины для ваших задач",
        lead: "Для маршрутов любой сложности",
        imageUrl: "",
        imageAlt: "",
        primaryCta: { label: "Подобрать шины", href: "/selection" },
        secondaryCta: { label: "Изучить каталог", href: "/models" },
        metricLabel: "10 лет",
        metricText: "помогаем выбрать шины",
      },
    });

    expect(findLinks(element)).toEqual([
      { label: "Подобрать шины", href: "/selection" },
      { label: "Изучить каталог", href: "/models" },
    ]);
    expect(collectText(element)).toContain("10 лет");
    expect(collectText(element)).toContain("помогаем выбрать шины");
  });

  it("does not render cleared calls to action", () => {
    const element = MainHero({
      content: {
        eyebrow: "",
        title: "Заголовок",
        lead: "",
        imageUrl: null,
        imageAlt: "",
        primaryCta: { label: "", href: "" },
        secondaryCta: { label: "", href: "" },
        metricLabel: "",
        metricText: "",
      },
    });

    expect(findLinks(element)).toEqual([]);
    expect(collectText(element)).not.toContain("Перейти в каталог");
  });

  it("renders the assigned media URL and does not invent an image after clear", () => {
    const assigned = MainHero({
      content: {
        eyebrow: "",
        title: "Заголовок",
        lead: "",
        imageUrl: "https://cdn.example.test/hero.jpg",
        imageAlt: "Кадр с шиной",
        primaryCta: { label: "", href: "" },
        secondaryCta: { label: "", href: "" },
        metricLabel: "",
        metricText: "",
      },
    });
    const cleared = MainHero({
      content: {
        eyebrow: "",
        title: "Заголовок",
        lead: "",
        imageUrl: null,
        imageAlt: "",
        primaryCta: { label: "", href: "" },
        secondaryCta: { label: "", href: "" },
        metricLabel: "",
        metricText: "",
      },
    });

    expect(findImageSources(assigned)).toContain("https://cdn.example.test/hero.jpg");
    expect(findImageSources(cleared)).toEqual([]);
  });
});
