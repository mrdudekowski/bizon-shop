import { describe, expect, it } from "vitest";

import { visibleChannels } from "./siteProfile";

describe("visibleChannels", () => {
  it("keeps an enabled http(s) link and drops any other scheme", () => {
    expect(visibleChannels([
      { id: "telegram", label: "Telegram", href: "https://t.me/bizon", enabled: true },
      { id: "bad", label: "Bad", href: "notaurl:bad", enabled: true },
      { id: "off", label: "Off", href: "https://t.me/off", enabled: false },
    ])).toEqual([
      { id: "telegram", label: "Telegram", href: "https://t.me/bizon", enabled: true },
    ]);
  });
});
