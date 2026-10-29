import { describe, expect, it } from "vitest";

import { PLACEHOLDER_SITE_PROFILE } from "@/lib/content/siteProfile";
import { createOrganizationStructuredData } from "./structuredData";

describe("createOrganizationStructuredData", () => {
  it("omits the contact point while phone and email are placeholder sentences", () => {
    expect(createOrganizationStructuredData(PLACEHOLDER_SITE_PROFILE)).not.toHaveProperty("contactPoint");
  });

  it("publishes only the contact values that are real", () => {
    const { contactPoint } = createOrganizationStructuredData({
      phone: PLACEHOLDER_SITE_PROFILE.phone,
      email: "sales@bizon.ru",
    }) as { contactPoint: Record<string, unknown> };

    expect(contactPoint.email).toBe("sales@bizon.ru");
    expect(contactPoint).not.toHaveProperty("telephone");
  });
});
