/**
 * Verify CMS can resolve tire/wheel image URLs after migrate+seed.
 */
for (const key of [
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_ENDPOINT",
  "S3_PUBLIC_URL",
  "S3_REGION",
]) {
  // Keep S3 as in .env.local for runtime-like check — do not clear.
}

const { getTireModelsByTypeSlug } = await import("../src/lib/cms/getTireModels");
const { getWheelModelByTypeAndSlug } = await import("../src/lib/cms/getWheelModels");
const { getTireTypes } = await import("../src/lib/cms/getTireTypes");
const { localMediaFileExists } = await import("../src/lib/cms/localMediaUrl");

const types = await getTireTypes();
console.log(
  "tire types:",
  types?.map((t) => ({ slug: t.slug, imageUrl: t.imageUrl })) ?? null,
);

const firstType = types?.[0]?.slug;
if (firstType) {
  const models = await getTireModelsByTypeSlug(firstType);
  console.log(
    "tire models:",
    models.map((m) => ({ slug: m.slug, imageUrl: m.imageUrl, gallery: m.gallery?.length })),
  );
  for (const m of models) {
    if (m.imageUrl?.startsWith("/media/")) {
      const name = m.imageUrl.replace("/media/", "");
      console.log(`  file ${name}: ${localMediaFileExists(name)}`);
    }
  }
}

const atlas = await getWheelModelByTypeAndSlug("forged", "atlas");
console.log(
  "atlas:",
  atlas
    ? {
        imageUrl: atlas.imageUrl,
        gallery: atlas.gallery?.map((g) => g.url),
      }
    : null,
);
if (atlas?.imageUrl?.startsWith("/media/")) {
  console.log(
    "atlas file exists:",
    localMediaFileExists(atlas.imageUrl.replace("/media/", "")),
  );
}

process.exit(0);
