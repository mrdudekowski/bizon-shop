for (const key of [
  "S3_BUCKET",
  "S3_ENDPOINT",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_PUBLIC_URL",
  "S3_REGION",
  "S3_FORCE_PATH_STYLE",
  "S3_ACL",
  "S3_PRIVATE",
]) {
  process.env[key] = "";
}

const { getPayload } = await import("../src/lib/payload/getPayload.ts");
const payload = await getPayload();

const variants = await payload.find({
  collection: "tire-variants",
  limit: 500,
  depth: 0,
});

const summary = {
  total: variants.totalDocs,
  withSku: 0,
  withSizeNormalized: 0,
  missingSku: [],
  missingSize: [],
};

for (const v of variants.docs) {
  if (v.sku?.trim()) summary.withSku += 1;
  else summary.missingSku.push(v.id);
  if (v.sizeNormalized?.trim()) summary.withSizeNormalized += 1;
  else summary.missingSize.push({ id: v.id, sizeRaw: v.sizeRaw, sku: v.sku });
}

console.log(JSON.stringify(summary, null, 2));
console.log(
  "sample",
  JSON.stringify(
    variants.docs.slice(0, 3).map((v) => ({
      id: v.id,
      sku: v.sku,
      sizeRaw: v.sizeRaw,
      sizeNormalized: v.sizeNormalized,
      tireModel: v.tireModel,
      status: v.status,
    })),
    null,
    2,
  ),
);
process.exit(0);
