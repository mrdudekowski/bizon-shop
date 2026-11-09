import { describe, expect, it } from "vitest";

import { absolutePublicUrl, createPageMetadata, createProductMetadata, productSearchDescription, textOrFallback } from "./metadata";

describe("createPageMetadata", () => {
  it("does not replace explicitly cleared CMS SEO with a hardcoded page title", () => {
    const metadata = createPageMetadata({ title: "", description: "", path: "/about" });

    expect(metadata.title).toBe("Bizon Tires");
    expect(metadata.description).toBe("");
    expect(metadata.openGraph?.title).toBe("Bizon Tires");
    expect(metadata.openGraph?.description).toBe("");
  });

  it("keeps a noindex page followable", () => {
    const metadata = createPageMetadata({ title: "Заявка", path: "/cart", noIndex: true });

    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});

describe("textOrFallback", () => {
  it("treats a blank CMS string as missing", () => {
    expect(textOrFallback("  ", "BIZON Shop")).toBe("BIZON Shop");
    expect(textOrFallback("Диски", "BIZON Shop")).toBe("Диски");
  });
});

describe("createProductMetadata", () => {
  it("keeps a blank product description off the tire homepage slogan", () => {
    const metadata = createProductMetadata({
      name: "Мега прицеп",
      slug: "mega-pritsep",
      brand: "BIZON",
      seoDescription: " ",
      descriptionShort: "",
    });

    expect(metadata.description).toBe(productSearchDescription({
      name: "Мега прицеп",
      brand: "BIZON",
      seoDescription: " ",
      descriptionShort: "",
    }));
    expect(metadata.description).toBe("Мега прицеп от BIZON в каталоге BIZON Shop.");
    expect(String(metadata.description)).not.toContain("большегрузная резина");
    expect(metadata.title).toBe("Мега прицеп | Bizon Tires");
  });

  it("encodes a plus in the public Open Graph image path", () => {
    expect(absolutePublicUrl("/brand/logo+text.png", "https://bizon.example")).toBe(
      "https://bizon.example/brand/logo%2Btext.png",
    );
  });
});
