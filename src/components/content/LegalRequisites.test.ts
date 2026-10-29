import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SiteProfile } from "@/lib/content/siteProfile";
import { LegalRequisites } from "./LegalRequisites";

const SEEDED_REQUISITES: SiteProfile["requisites"] = [
  { id: "legal-name", label: "Полное наименование", value: "Информация будет предоставлена позже." },
  { id: "legal-address", label: "Юридический адрес", value: "Информация будет предоставлена позже." },
  { id: "inn", label: "ИНН", value: "Информация будет предоставлена позже." },
  { id: "ogrn", label: "ОГРН", value: "Информация будет предоставлена позже." },
];

const baseProfile: SiteProfile = {
  phone: "",
  email: "",
  address: "",
  channelsNote: "",
  channels: [],
  legalSummary: "Юридические реквизиты будут предоставлены позже.",
  requisites: SEEDED_REQUISITES,
  priceNotice: "",
  madeToOrderNotice: "",
};

describe("LegalRequisites", () => {
  it("renders a definition list for seeded requisites and keeps all rows when one is added", () => {
    const seededHtml = renderToStaticMarkup(createElement(LegalRequisites, { siteProfile: baseProfile }));

    expect(seededHtml).toContain("<dl");
    for (const requisite of SEEDED_REQUISITES) {
      expect(seededHtml).toContain(requisite.label);
      expect(seededHtml).toContain(requisite.value);
    }

    const extendedHtml = renderToStaticMarkup(
      createElement(LegalRequisites, {
        siteProfile: {
          ...baseProfile,
          requisites: [...SEEDED_REQUISITES, { id: "kpp", label: "КПП", value: "000" }],
        },
      }),
    );

    expect(extendedHtml).toContain("КПП");
    expect(extendedHtml).toContain("000");
    for (const requisite of SEEDED_REQUISITES) {
      expect(extendedHtml).toContain(requisite.label);
    }
  });
});
