import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TireIqApplicationGuide } from "./TireIqApplicationGuide";
import { TireIqAxleSelector } from "./TireIqAxleSelector";
import { TireIqBusSelector } from "./TireIqBusSelector";
import { TireIqDumpTruckSelector } from "./TireIqDumpTruckSelector";

function hrefFor(html: string, label: string) {
  const anchors = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
  const anchor = anchors.find((match) => match[2].includes(label));
  expect(anchor, label).toBeTruthy();
  const href = anchor![1].match(/href="([^"]*)"/);
  expect(href, label).toBeTruthy();
  return href![1];
}

describe("Tire IQ axle selectors", () => {
  it("keeps topic=axles on axle, dump, and bus selector links", () => {
    const truck = renderToStaticMarkup(createElement(TireIqAxleSelector));
    const dump = renderToStaticMarkup(createElement(TireIqDumpTruckSelector));
    const bus = renderToStaticMarkup(createElement(TireIqBusSelector));
    const guide = renderToStaticMarkup(createElement(TireIqApplicationGuide));

    for (const label of ["Рулевая ось", "Ведущая ось", "Прицепная ось"]) {
      const href = hrefFor(truck, label);
      expect(href, label).toContain("topic=axles");
      expect(href, label).toContain("#knowledge");
    }
    for (const label of ["Рулевая ось", "Ведущая ось"]) {
      expect(hrefFor(dump, label)).toContain("topic=axles");
      expect(hrefFor(bus, label)).toContain("topic=axles");
    }
    for (const label of ["Рулевая", "Ведущая", "Прицепная"]) {
      const href = hrefFor(guide, label);
      expect(href, label).toContain("topic=axles");
      expect(href, label).toContain("#knowledge");
    }
  });

  it("sends the axle selectors to contact when no knowledge is published", () => {
    const truck = renderToStaticMarkup(createElement(TireIqAxleSelector, { hasKnowledge: false }));
    const dump = renderToStaticMarkup(createElement(TireIqDumpTruckSelector, { hasKnowledge: false }));
    const bus = renderToStaticMarkup(createElement(TireIqBusSelector, { hasKnowledge: false }));
    const guide = renderToStaticMarkup(createElement(TireIqApplicationGuide, { hasKnowledge: false }));
    expect(hrefFor(truck, "Рулевая ось")).toBe("/contact");
    expect(hrefFor(dump, "Ведущая ось")).toBe("/contact");
    expect(hrefFor(bus, "Рулевая ось")).toBe("/contact");
    expect(hrefFor(guide, "Прицепная")).toBe("/contact");
  });
});
