import { describe, expect, it } from "vitest";
import { MIGRATIONS } from "../migrations";
import { siteProfileMigration } from "../migrations/0023-site-profile";
import { CUSTOMER_COPY } from "./customerTemplateCopy";
import { contactHref, visibleChannels } from "./siteProfile";

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
    expect(MIGRATIONS.at(-1)).toBe(siteProfileMigration);
  });
});

