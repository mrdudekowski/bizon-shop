/**
 * Staging: attach mainImage to every tire-model, then publish models + variants.
 * Reuses an existing Media row (S3 upload often broken locally).
 * Run:
 *   cross-env DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:55433/bizon_payload_stage npx payload run .codex-temp/publish-all-tires.mjs
 */
import { getPayload } from "payload";
import config from "@payload-config";

const payload = await getPayload({ config });

const media = await payload.find({
  collection: "media",
  limit: 1,
  depth: 0,
  overrideAccess: true,
  sort: "createdAt",
});
const mediaId = media.docs[0]?.id;
if (!mediaId) throw new Error("No media in DB — cannot satisfy mainImage gate");
console.log(`reuse media #${mediaId} (${media.docs[0].filename})`);

const models = await payload.find({
  collection: "tire-models",
  limit: 500,
  pagination: false,
  depth: 0,
  overrideAccess: true,
});

let modelsOk = 0;
let modelsFail = [];
for (const model of models.docs) {
  try {
    await payload.update({
      collection: "tire-models",
      id: model.id,
      data: {
        mainImage: mediaId,
        status: "published",
      },
      overrideAccess: true,
    });
    modelsOk++;
    console.log(`model published: ${model.slug} (#${model.id})`);
  } catch (err) {
    modelsFail.push({ id: model.id, slug: model.slug, error: String(err?.message || err) });
    console.error(`model FAIL: ${model.slug}`, err?.message || err);
  }
}

const variants = await payload.find({
  collection: "tire-variants",
  limit: 1000,
  pagination: false,
  depth: 0,
  overrideAccess: true,
});

let variantsOk = 0;
let variantsFail = [];
for (const variant of variants.docs) {
  try {
    await payload.update({
      collection: "tire-variants",
      id: variant.id,
      data: { status: "published" },
      overrideAccess: true,
    });
    variantsOk++;
  } catch (err) {
    variantsFail.push({ id: variant.id, sku: variant.sku, error: String(err?.message || err) });
    console.error(`variant FAIL: ${variant.sku}`, err?.message || err);
  }
}

const publishedModels = await payload.count({
  collection: "tire-models",
  where: { status: { equals: "published" } },
  overrideAccess: true,
});
const publishedVariants = await payload.count({
  collection: "tire-variants",
  where: { status: { equals: "published" } },
  overrideAccess: true,
});

console.log(
  JSON.stringify(
    {
      modelsOk,
      modelsFail,
      variantsOk,
      variantsFail,
      publishedModels: publishedModels.totalDocs,
      publishedVariants: publishedVariants.totalDocs,
    },
    null,
    2,
  ),
);
process.exit(modelsFail.length || variantsFail.length ? 1 : 0);
