import { describe, expect, it } from "vitest";

import {
  assertPublicSiteReadiness,
  findPublicSiteReadinessIssues,
} from "./publicSite";

describe("findPublicSiteReadinessIssues", () => {
  it("rejects placeholder contact sentences, example host, and missing public assets", () => {
    expect(
      findPublicSiteReadinessIssues({
        phone: "Контактный номер будет опубликован позже.",
        email: "Контактный email будет опубликован позже.",
        siteUrl: "https://bizontires.example",
        publicAssets: new Set<string>(),
      }).map((issue) => issue.code),
    ).toEqual([
      "placeholder_phone",
      "placeholder_email",
      "placeholder_site_url",
      "missing_og_image",
      "missing_logo",
    ]);
  });

  it("accepts configured contacts and committed brand assets", () => {
    expect(
      findPublicSiteReadinessIssues({
        phone: "+7 (423) 000-00-01",
        email: "sales@bizon.ru",
        siteUrl: "https://bizon.ru",
        publicAssets: new Set(["/brand/logo+text.png", "/brand/bizon.svg"]),
      }),
    ).toEqual([]);
  });

  it("throws when release-blocking issues remain", () => {
    expect(() =>
      assertPublicSiteReadiness([
        {
          code: "placeholder_phone",
          message: "Publish a phone number in the CMS site profile",
        },
      ]),
    ).toThrow("[placeholder_phone] Publish a phone number in the CMS site profile");
  });
});
