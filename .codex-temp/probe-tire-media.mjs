/**
 * Probe tire-types / tire-models media relations for photo-loading debug.
 */
for (const key of [
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_ENDPOINT",
  "S3_PUBLIC_URL",
  "S3_REGION",
]) {
  process.env[key] = "";
}

const { getPayload } = await import("../src/lib/payload/getPayload.ts");
const { resolveMedia } = await import("../src/lib/cms/media.ts");
const { mapTireType, mapTireModelDetail } = await import(
  "../src/lib/cms/payload/mappers.ts"
);

const payload = await getPayload();

const types = await payload.find({
  collection: "tire-types",
  limit: 20,
  depth: 1,
  overrideAccess: true,
});

console.log("=== tire-types ===");
for (const doc of types.docs) {
  const cover = doc.coverImage;
  const mapped = mapTireType(doc);
  console.log({
    slug: doc.slug,
    status: doc.status,
    coverImage:
      cover && typeof cover === "object"
        ? {
            id: cover.id,
            filename: cover.filename,
            url: cover.url,
            status: cover.status,
            sizes: cover.sizes
              ? Object.fromEntries(
                  Object.entries(cover.sizes).map(([k, v]) => [
                    k,
                    v && typeof v === "object"
                      ? { filename: v.filename, url: v.url }
                      : v,
                  ]),
                )
              : null,
            resolved: resolveMedia(cover, "card"),
          }
        : cover,
    mappedImageUrl: mapped.imageUrl,
  });
}

const models = await payload.find({
  collection: "tire-models",
  limit: 50,
  depth: 1,
  overrideAccess: true,
  where: { status: { equals: "published" } },
});

console.log("=== published tire-models ===");
for (const doc of models.docs) {
  const main = doc.mainImage;
  const mapped = mapTireModelDetail(doc);
  const variants = await payload.find({
    collection: "tire-variants",
    where: {
      and: [
        { tireModel: { equals: doc.id } },
        { status: { equals: "published" } },
      ],
    },
    limit: 3,
    depth: 0,
    overrideAccess: true,
  });
  console.log({
    slug: doc.slug,
    status: doc.status,
    mainImage:
      main && typeof main === "object"
        ? {
            id: main.id,
            filename: main.filename,
            url: main.url,
            status: main.status,
            resolvedCard: resolveMedia(main, "card"),
            resolvedHero: resolveMedia(main, "hero"),
          }
        : main,
    mappedImageUrl: mapped.imageUrl,
    publishedVariants: variants.docs.map((v) => ({
      id: v.id,
      size: v.sizeNormalized || v.sizeRaw,
      status: v.status,
    })),
  });
}

process.exit(0);
