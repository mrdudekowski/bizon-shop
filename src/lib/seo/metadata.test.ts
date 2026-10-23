import { describe, expect, it } from "vitest";

import { createPageMetadata } from "./metadata";

describe("createPageMetadata", () => {
  it("does not replace explicitly cleared CMS SEO with a hardcoded page title", () => {
    const metadata = createPageMetadata({ title: "", description: "", path: "/about" });

    expect(metadata.title).toBe("Bizon Tires");
    expect(metadata.description).toBe("");
    expect(metadata.openGraph?.title).toBe("Bizon Tires");
    expect(metadata.openGraph?.description).toBe("");
  });
});
