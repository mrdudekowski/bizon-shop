import { getPayload } from "../src/lib/payload/getPayload.ts";

const p = await getPayload();
for (const status of ["draft", "published", "archived"]) {
  const r = await p.find({
    collection: "tire-models",
    where: { status: { equals: status } },
    limit: 0,
  });
  console.log("tire-models", status, r.totalDocs);
}
const sample = await p.find({
  collection: "tire-models",
  limit: 8,
  depth: 0,
  sort: "-updatedAt",
});
console.log(
  JSON.stringify(
    sample.docs.map((d) => ({
      id: d.id,
      slug: d.slug,
      status: d.status,
      hasImage: Boolean(d.mainImage),
      features: (d.features || []).length,
    })),
    null,
    2,
  ),
);
const variants = await p.find({ collection: "tire-variants", limit: 0 });
const pubV = await p.find({
  collection: "tire-variants",
  where: { status: { equals: "published" } },
  limit: 0,
});
console.log("tire-variants total", variants.totalDocs, "published", pubV.totalDocs);
process.exit(0);
