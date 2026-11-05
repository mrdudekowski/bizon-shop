import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PLACEHOLDER_SITE_PROFILE, type SiteProfile } from "@/lib/content/siteProfile";

import { ContactRequest } from "./ContactRequest";

const profile: SiteProfile = {
  ...PLACEHOLDER_SITE_PROFILE,
  phone: "+7 (421) 200-00-00",
  email: "sales@bizon.ru",
  channels: [
    { id: "whatsapp", label: "WhatsApp", href: "https://wa.me/74212000000", enabled: true },
    { id: "telegram", label: "Telegram", href: "https://t.me/bizon", enabled: true },
    { id: "max", label: "MAX", href: "", enabled: true },
    { id: "vk", label: "VK", href: "https://vk.com/bizon", enabled: true },
  ],
};

const render = (surface: SiteProfile["contactSurface"], notice?: string) =>
  renderToStaticMarkup(createElement(ContactRequest, {
    profile: { ...profile, contactSurface: surface },
    notice,
    children: createElement("form", null, "Заявка"),
  }));

describe("ContactRequest", () => {
  it("keeps the request form until contacts are published as a card", () => {
    const html = render("form", "Форма заявки скоро появится!");
    expect(html).toContain("<form");
    expect(html).not.toContain("Форма заявки скоро появится!");
  });

  it("replaces the form with the visible Telegram and WhatsApp buttons, in that order", () => {
    const html = render("card");
    expect(html).not.toContain("<form");
    expect(html).toContain("tel:+74212000000");
    expect(html).toContain("mailto:sales@bizon.ru");
    expect(html.indexOf("Telegram")).toBeLessThan(html.indexOf("WhatsApp"));
    expect(html).not.toContain("MAX");
    expect(html).not.toContain("VK");
    expect(html).not.toContain("Форма заявки скоро появится!");
  });

  it("prints the cart disclaimer only on the cart card", () => {
    expect(render("card", "Форма заявки скоро появится!")).toContain("Форма заявки скоро появится!");
  });
});
