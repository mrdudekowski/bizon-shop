import { describe, expect, it } from "vitest";
import { siteProfileMigration } from "../migrations/0023-site-profile";
import { CUSTOMER_COPY } from "./customerTemplateCopy";
import { contactHref, siteChannelsAreValid, visibleChannels, writeSiteProfileContacts } from "./siteProfile";

describe("site profile visibility", () => {
  it("hides a channel without a link or with enabled false", () => {
    expect(visibleChannels([
      { id: "telegram", label: "Telegram", href: "https://t.me/bizon", enabled: true },
      { id: "vk", label: "VK", href: "", enabled: true },
      { id: "max", label: "MAX", href: "https://max.ru/bizon", enabled: false },
    ])).toEqual([
      { id: "telegram", label: "Telegram", href: "https://t.me/bizon", enabled: true },
    ]);
  });

  it("links a real phone and email and does not link a placeholder sentence", () => {
    expect(contactHref("phone", "+7 (421) 000-00-11")).toBe("tel:+74210000011");
    expect(contactHref("email", "sales@bizon.ru")).toBe("mailto:sales@bizon.ru");
    expect(contactHref("phone", "Контактный номер будет опубликован позже.")).toBeNull();
    expect(contactHref("email", "Контактный email будет опубликован позже.")).toBeNull();
  });
});

describe("site profile migration", () => {
  it("seeds the placeholder sentences from the shared customer copy", () => {
    expect(siteProfileMigration.version).toBe("202610290023");
    for (const sentence of [
      CUSTOMER_COPY.phone,
      CUSTOMER_COPY.email,
      CUSTOMER_COPY.address,
      CUSTOMER_COPY.channelsNote,
      CUSTOMER_COPY.legalSummary,
      CUSTOMER_COPY.requisitePlaceholder,
      CUSTOMER_COPY.priceNotice.join("\n\n"),
      CUSTOMER_COPY.madeToOrderNotice.join("\n\n"),
    ]) {
      expect(siteProfileMigration.sql).toContain(sentence);
    }
  });
});


describe("site profile contact write", () => {
  const contacts = {
    phone: "+7 (421) 200-00-00",
    email: "sales@bizon.ru",
    address: "Хабаровск",
    channels: [
      { id: "telegram", label: "Telegram", href: "https://t.me/bizon", enabled: true },
      { id: "channel-1", label: "Дзен", href: "", enabled: false },
    ],
  };

  it("upserts the contacts and replaces the channel rows in draft order", async () => {
    const calls: { sql: string; params: unknown[] }[] = [];
    await writeSiteProfileContacts({ query: async (sql, params = []) => { calls.push({ sql, params }); return []; } }, contacts);

    expect(calls[0].sql).toContain("INSERT INTO site_profile");
    expect(calls[0].sql).toContain("ON CONFLICT (id) DO UPDATE");
    expect(calls[0].params.slice(0, 3)).toEqual(["+7 (421) 200-00-00", "sales@bizon.ru", "Хабаровск"]);
    expect(calls[1].sql).toContain("DELETE FROM site_profile_channels");
    expect(calls.slice(2).map((call) => call.params)).toEqual([
      ["telegram", 0, "Telegram", "https://t.me/bizon", true],
      ["channel-1", 1, "Дзен", "", false],
    ]);
  });

  it("rejects duplicate ids, blank labels and links that are not http(s)", () => {
    const channel = contacts.channels[0];
    expect(siteChannelsAreValid(contacts.channels)).toBe(true);
    expect(siteChannelsAreValid([channel, { ...channel }])).toBe(false);
    expect(siteChannelsAreValid([{ ...channel, label: " " }])).toBe(false);
    expect(siteChannelsAreValid([{ ...channel, href: "javascript:alert(1)" }])).toBe(false);
  });
});