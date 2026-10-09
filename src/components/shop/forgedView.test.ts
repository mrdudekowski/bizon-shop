import { describe, expect, it } from "vitest";

import { metaLine, toForgedWheelView } from "./forgedView";

const cmsModel = {
  id: "wheel-42",
  slug: "atlas",
  name: "Atlas",
  wheelTypeSlug: "forged",
  wheelTypeName: "Forged",
  series: "  Satin Black  ",
  designStyle: "  Monoblock  ",
  descriptionShort: "Forged for demanding routes.",
  descriptionLong: "Long description",
  imageUrl: "  /media/atlas.png  ",
  gallery: [{ url: "/media/atlas-detail.png", alt: "Atlas wheel detail", label: "Detail" }],
  showInMenu: true,
  menuOrder: 0,
};

describe("forged wheel view mapping", () => {
  it("maps CMS fields and trims optional metadata", () => {
    const view = toForgedWheelView(cmsModel);
    expect(view).toEqual({
      id: "wheel-42",
      slug: "atlas",
      name: "Atlas",
      positioning: "Monoblock",
      finish: "Satin Black",
      description: "Forged for demanding routes.",
      heroImage: "/media/atlas.png",
      gallery: [{ src: "/media/atlas-detail.png", alt: "Atlas wheel detail", label: "Detail" }],
    });
    expect(view && metaLine(view)).toBe("Monoblock · Satin Black");
  });

  it("rejects models without a usable hero image", () => {
    expect(toForgedWheelView({ ...cmsModel, imageUrl: "   " })).toBeNull();
  });

  it("uses the forged fallback and omits an empty finish", () => {
    const view = toForgedWheelView({ ...cmsModel, designStyle: " ", series: " " });
    expect(view).toMatchObject({ positioning: "Forged", finish: "" });
    expect(view && metaLine(view)).toBe("Forged");
  });
});
