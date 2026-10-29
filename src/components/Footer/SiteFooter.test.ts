import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PLACEHOLDER_SITE_PROFILE, type SiteProfile } from "@/lib/content/siteProfile";
import { SiteFooter } from "./SiteFooter";

const renderFooter = (siteProfile: SiteProfile) =>
  renderToStaticMarkup(createElement(SiteFooter, { surface: "main", siteProfile }));

describe("SiteFooter contacts", () => {
  it("labels the three rows and shows the placeholder sentences without links", () => {
    const html = renderFooter(PLACEHOLDER_SITE_PROFILE);

    for (const text of [
      "Телефон",
      "Email",
      "Адрес",
      "Контактный номер будет опубликован позже.",
      "Контактный email будет опубликован позже.",
      "Адрес компании будет опубликован позже.",
      "Актуальные ссылки на каналы связи будут опубликованы позже.",
    ]) {
      expect(html).toContain(text);
    }
    expect(html).not.toContain('<a href="tel:');
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain('target="_blank"');
  });

  it("links a real phone, email and an enabled channel, and hides disabled ones", () => {
    const html = renderFooter({
      ...PLACEHOLDER_SITE_PROFILE,
      phone: "+7 (421) 200-00-00",
      email: "sales@bizon.ru",
      channels: [
        { id: "telegram", label: "Telegram", href: "https://t.me/bizon", enabled: true },
        { id: "vk", label: "VK", href: "https://vk.com/bizon", enabled: false },
        { id: "max", label: "MAX", href: "", enabled: true },
      ],
    });

    expect(html).toContain('href="tel:+74212000000"');
    expect(html).toContain('href="mailto:sales@bizon.ru"');
    expect(html).toContain('href="https://t.me/bizon"');
    expect(html.match(/target="_blank"/g)).toHaveLength(1);
    expect(html).not.toContain("vk.com");
    expect(html).not.toContain("Актуальные ссылки на каналы связи");
  });

  it("shows the placeholder sentence when the editor clears a contact value", () => {
    const html = renderFooter({ ...PLACEHOLDER_SITE_PROFILE, phone: "", email: " ", address: "" });

    expect(html).toContain("Контактный номер будет опубликован позже.");
    expect(html).toContain("Контактный email будет опубликован позже.");
    expect(html).toContain("Адрес компании будет опубликован позже.");
  });

  it("renders a custom channel as a text link with its label", () => {
    const html = renderFooter({
      ...PLACEHOLDER_SITE_PROFILE,
      channels: [{ id: "custom-1", label: "Дзен", href: "https://dzen.ru/bizon", enabled: true }],
    });

    expect(html).toMatch(/<a [^>]*href="https:\/\/dzen\.ru\/bizon"[^>]*>Дзен<\/a>/);
  });
});
