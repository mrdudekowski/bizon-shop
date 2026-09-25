import { getPayload } from "../src/lib/payload/getPayload.ts";

const payload = await getPayload();

const tireFieldNames = [];
for (const field of payload.collections["tire-models"].config.fields) {
  if (field?.name) tireFieldNames.push(field.name);
  if (field?.type === "tabs" && Array.isArray(field.tabs)) {
    for (const tab of field.tabs) {
      for (const nested of tab.fields ?? []) {
        if (nested?.name) tireFieldNames.push(nested.name);
      }
    }
  }
}

const wheelFieldNames = [];
for (const field of payload.collections["wheel-models"].config.fields) {
  if (field?.name) wheelFieldNames.push(field.name);
}

const models = await payload.find({
  collection: "tire-models",
  where: { status: { equals: "published" } },
  limit: 5,
  depth: 1,
});
const wheels = await payload.find({
  collection: "wheel-models",
  where: { status: { equals: "published" } },
  limit: 5,
  depth: 1,
});
const variants = await payload.find({
  collection: "tire-variants",
  where: { status: { equals: "published" } },
  limit: 5,
  depth: 0,
});

console.log(
  JSON.stringify(
    {
      collections: Object.keys(payload.collections).sort(),
      hasModelFeatures: Boolean(payload.collections["model-features"]),
      tireModelFields: [...new Set(tireFieldNames)].sort(),
      wheelModelFields: [...new Set(wheelFieldNames)].sort(),
      sampleTire: models.docs.map((d) => ({
        id: d.id,
        slug: d.slug,
        status: d.status,
        hasMainImage: Boolean(d.mainImage),
        featuresCount: Array.isArray(d.features) ? d.features.length : 0,
        hasVerification: Object.prototype.hasOwnProperty.call(d, "verificationStatus"),
        hasCatalogId: Object.prototype.hasOwnProperty.call(d, "catalogId"),
        applicationTypes: d.applicationTypes ?? null,
      })),
      sampleWheel: wheels.docs.map((d) => ({
        id: d.id,
        slug: d.slug,
        status: d.status,
        hasMainImage: Boolean(d.mainImage),
        galleryCount: Array.isArray(d.gallery) ? d.gallery.length : 0,
      })),
      sampleVariantSku: variants.docs.map((d) => ({
        id: d.id,
        sku: d.sku,
        sizeRaw: d.sizeRaw,
        sizeNormalized: d.sizeNormalized,
      })),
    },
    null,
    2,
  ),
);

process.exit(0);
