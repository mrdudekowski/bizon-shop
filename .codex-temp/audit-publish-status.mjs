import { getPayload } from "payload";
import config from "@payload-config";

const COLLECTIONS = [
  "tire-types",
  "tire-models",
  "tire-variants",
  "wheel-types",
  "wheel-models",
  "wheel-variants",
  "shop-categories",
  "products",
  "tire-iq-articles",
  "people-stories",
  "media",
];

const payload = await getPayload({ config });
const report = [];

for (const collection of COLLECTIONS) {
  const all = await payload.find({
    collection,
    limit: 500,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });
  const byStatus = {};
  const unpublished = [];
  for (const doc of all.docs) {
    const status = doc.status ?? "(none)";
    byStatus[status] = (byStatus[status] ?? 0) + 1;
    if (status !== "published") {
      unpublished.push({
        id: doc.id,
        title: doc.name ?? doc.title ?? doc.sku ?? doc.sizeNormalized ?? doc.filename ?? doc.slug,
        slug: doc.slug ?? null,
        status,
      });
    }
  }
  report.push({
    collection,
    total: all.totalDocs,
    byStatus,
    unpublished: unpublished.slice(0, 30),
    unpublishedMore: Math.max(0, unpublished.length - 30),
  });
}

console.log(JSON.stringify(report, null, 2));
process.exit(0);
