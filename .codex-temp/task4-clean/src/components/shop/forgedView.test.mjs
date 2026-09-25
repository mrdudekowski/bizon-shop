import assert from "node:assert/strict";
import test from "node:test";
import { metaLine, toForgedWheelView } from "./forgedView.ts";

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
  gallery: [
    {
      url: "/media/atlas-detail.png",
      alt: "Atlas wheel detail",
      label: "Detail",
    },
  ],
};

test("maps CMS wheel fields to the forged view", () => {
  const view = toForgedWheelView(cmsModel);

  assert.deepEqual(view, {
    id: "wheel-42",
    slug: "atlas",
    name: "Atlas",
    positioning: "Monoblock",
    finish: "Satin Black",
    description: "Forged for demanding routes.",
    heroImage: "/media/atlas.png",
    gallery: [
      {
        src: "/media/atlas-detail.png",
        alt: "Atlas wheel detail",
        label: "Detail",
      },
    ],
  });
  assert.equal(metaLine(view), "Monoblock · Satin Black");
});

test("rejects models without a usable hero image", () => {
  assert.equal(toForgedWheelView({ ...cmsModel, imageUrl: "   " }), null);
});

test("uses the forged fallback and omits an empty finish from metadata", () => {
  const view = toForgedWheelView({
    ...cmsModel,
    designStyle: " ",
    series: " ",
  });

  assert.equal(view.positioning, "Forged");
  assert.equal(view.finish, "");
  assert.equal(metaLine(view), "Forged");
});
