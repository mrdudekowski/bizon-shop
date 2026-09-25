import { getPayload } from "../src/lib/payload/getPayload";

const CATEGORY_SEEDS = [
  { slug: "accessories", name: "Аксессуары", description: "Fleet accessories beyond tyres.", sortOrder: 0 },
  { slug: "outdoor", name: "Outdoor", description: "Outdoor gear for fleet operators.", sortOrder: 1 },
  { slug: "glasses", name: "Glasses", description: "Protective eyewear.", sortOrder: 2 },
  { slug: "merch", name: "Merch", description: "BIZON branded merchandise.", sortOrder: 3 },
];

console.log("seed-shop: connecting…");
const payload = await getPayload();

const categoryIds: Record<string, number> = {};

for (const seed of CATEGORY_SEEDS) {
  const existing = await payload.find({
    collection: "shop-categories",
    where: { slug: { equals: seed.slug } },
    limit: 1,
    depth: 0,
  });

  if (existing.docs[0]) {
    const updated = await payload.update({
      collection: "shop-categories",
      id: existing.docs[0].id,
      data: { ...seed, status: "published", showInMenu: true, showOnShopHome: true },
    });
    categoryIds[seed.slug] = updated.id;
    console.log(`Updated category: ${seed.slug}`);
  } else {
    const created = await payload.create({
      collection: "shop-categories",
      data: { ...seed, status: "published", showInMenu: true, showOnShopHome: true },
    });
    categoryIds[seed.slug] = created.id;
    console.log(`Created category: ${seed.slug}`);
  }
}

const merchId = categoryIds.merch;
if (merchId) {
  const cap = await payload.find({
    collection: "products",
    where: { slug: { equals: "bizon-cap" } },
    limit: 1,
    depth: 0,
  });

  const productData = {
    name: "BIZON Cap",
    slug: "bizon-cap",
    shopCategory: merchId,
    shortDescription: "Брендированная кепка BIZON.",
    priceOnRequest: true,
    status: "published" as const,
  };

  if (cap.docs[0]) {
    await payload.update({ collection: "products", id: cap.docs[0].id, data: productData });
    console.log("Updated product: bizon-cap");
  } else {
    await payload.create({ collection: "products", data: productData });
    console.log("Created product: bizon-cap");
  }
}

console.log("Done.");
process.exit(0);
