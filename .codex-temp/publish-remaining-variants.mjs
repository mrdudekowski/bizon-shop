import { getPayload } from "payload";
import config from "@payload-config";

const payload = await getPayload({ config });
const ids = [35, 36];

for (const id of ids) {
  try {
    const updated = await payload.update({
      collection: "tire-variants",
      id,
      data: {
        sizeRaw: "13R22.5",
        status: "published",
      },
      overrideAccess: true,
    });
    console.log("ok", {
      id: updated.id,
      sku: updated.sku,
      status: updated.status,
      sizeNormalized: updated.sizeNormalized,
    });
  } catch (err) {
    console.error("FAIL", id, err?.message || err);
  }
}

const published = await payload.count({
  collection: "tire-variants",
  where: { status: { equals: "published" } },
  overrideAccess: true,
});
const draft = await payload.count({
  collection: "tire-variants",
  where: { status: { equals: "draft" } },
  overrideAccess: true,
});
console.log({ published: published.totalDocs, draft: draft.totalDocs });
process.exit(0);
