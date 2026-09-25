import { getPayload } from "../src/lib/payload/getPayload";
const payload = await getPayload();
const doc = await payload.findByID({ collection: "tire-models", id: 24, depth: 0, overrideAccess: true });
console.log(JSON.stringify({ id: doc.id, slug: doc.slug, status: doc.status, mainImage: doc.mainImage }, null, 2));
const publishedNoImage = await payload.find({
  collection: "tire-models",
  where: { and: [{ status: { equals: "published" } }, { mainImage: { exists: false } }] },
  limit: 50,
  depth: 0,
  overrideAccess: true,
});
console.log("publishedWithoutMainImage=", publishedNoImage.totalDocs);
process.exit(0);
