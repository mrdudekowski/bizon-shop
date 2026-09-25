/**
 * Clear S3 prefixes on media while forcing local-storage mode.
 * Must wipe S3_* before loading Payload (dotenv in .env.local would re-enable S3).
 */
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
  delete process.env[key];
}

const { getPayload } = await import("../src/lib/payload/getPayload.ts");

const payload = await getPayload();
const all = await payload.find({
  collection: "media",
  limit: 500,
  depth: 0,
});

let cleared = 0;
for (const doc of all.docs) {
  if (!doc.prefix) continue;
  await payload.update({
    collection: "media",
    id: doc.id,
    data: { prefix: null },
    overrideAccess: true,
  });
  cleared += 1;
}

const check = await payload.find({
  collection: "media",
  where: { filename: { equals: "bizon-atlas-hero-3q.png" } },
  limit: 1,
  depth: 0,
});
const sample = check.docs[0];
console.log(
  JSON.stringify(
    {
      s3Enabled: Boolean(process.env.S3_BUCKET),
      cleared,
      sampleUrl: sample?.url,
      samplePrefix: sample?.prefix ?? null,
      sampleCard: sample?.sizes?.card?.url ?? null,
    },
    null,
    2,
  ),
);
process.exit(sample?.url?.startsWith("/media/") ? 0 : 1);
