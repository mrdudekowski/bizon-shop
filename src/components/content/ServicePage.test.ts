import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ServicePage } from "./ServicePage";

describe("ServicePage documents", () => {
  it("hides empty CMS hero and editorial fields instead of rendering fallback copy", () => {
    const html = renderToStaticMarkup(
      createElement(ServicePage, {
        kicker: "",
        title: "",
        description: "",
        breadcrumbs: [],
        featuresHeading: "",
        features: [],
        notice: undefined,
        editorial: {
          featuresHeading: "",
          features: [],
          sections: [],
          notice: null,
          proof: null,
          cta: null,
        },
      }),
    );

    expect(html).not.toContain("<h1");
    expect(html).not.toContain("<h2");
    expect(html).not.toContain("<h3");
  });

  it("renders published document links with their CMS title", () => {
    const html = renderToStaticMarkup(
      createElement(ServicePage, {
        title: "Гарантия",
        description: "Условия",
        breadcrumbs: [],
        features: [],
        documents: [{ url: "https://cdn.example.test/warranty.pdf", title: "Условия гарантии" }],
      }),
    );

    expect(html).toContain("Документы");
    expect(html).toContain('href="https://cdn.example.test/warranty.pdf"');
    expect(html).toContain("Условия гарантии");
  });

  it("uses configured CMS editorial blocks instead of the legacy page content", () => {
    const html = renderToStaticMarkup(
      createElement(ServicePage, {
        title: "Гарантия",
        description: "Условия",
        breadcrumbs: [],
        features: [{ title: "Старый блок", text: "Не должен появиться" }],
        featuresHeading: "Старый заголовок",
        notice: "Старое уведомление",
        editorial: {
          featuresHeading: "Заголовок из CMS",
          features: [{ id: "cms-feature-1", title: "Факт из CMS", text: "Описание из CMS" }],
          sections: [{ id: "cms-section-1", heading: "Раздел из CMS", body: "Текст из CMS" }],
          notice: null,
          proof: null,
          cta: null,
        },
      }, createElement("p", null, "Старый раздел")),
    );

    expect(html).toContain("Заголовок из CMS");
    expect(html).toContain("Факт из CMS");
    expect(html).toContain("Описание из CMS");
    expect(html).toContain("Раздел из CMS");
    expect(html).toContain("Текст из CMS");
    expect(html).not.toContain("Старый блок");
    expect(html).not.toContain("Старое уведомление");
    expect(html).not.toContain("Старый раздел");
  });

  it("keeps an explicitly empty CMS section list empty", () => {
    const html = renderToStaticMarkup(
      createElement(ServicePage, {
        title: "Гарантия",
        description: "Условия",
        breadcrumbs: [],
        features: [],
        editorial: { sections: [] },
      }, createElement("p", null, "Legacy paragraph")),
    );
    expect(html).not.toContain("Legacy paragraph");
  });
});
