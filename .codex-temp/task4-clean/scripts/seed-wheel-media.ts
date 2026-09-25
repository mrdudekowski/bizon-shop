/**
 * Uploads forged wheel PNGs into Payload Media and links them on wheel-models.
 *
 * Run (staging recommended):
 *   cross-env DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:55433/bizon_payload_stage npm run seed:wheel-media
 *
 * Views: hero-3q → mainImage; front, depth-3q, detail → gallery (order).
 * Idempotent by media.filename.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SHOP_WHEEL_DESIGNS } from "../src/constants/shopWheels";
import { getPayload } from "../src/lib/payload/getPayload";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const GALLERY_VIEWS = [
  { view: "front", title: "Front", altSuffix: "фронтальный вид" },
  { view: "depth-3q", title: "Depth", altSuffix: "объём и глубина профиля" },
  { view: "detail", title: "Detail", altSuffix: "деталь поверхности" },
] as const;

function wheelFile(slug: string, view: string) {
  return path.join(
    ROOT,
    "public/images/premium/shop/wheels",
    slug,
    `bizon-${slug}-${view}.png`,
  );
}

async function ensureMedia(
  payload: Awaited<ReturnType<typeof getPayload>>,
  filePath: string,
  data: { title: string; alt: string },
) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing wheel image: ${filePath}`);
  }
  const filename = path.basename(filePath);
  const existing = await payload.find({
    collection: "media",
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
  });
  if (existing.docs[0]) {
    console.log(`  media kept: ${filename} (#${existing.docs[0].id})`);
    return existing.docs[0].id;
  }
  const created = await payload.create({
    collection: "media",
    data: {
      title: data.title,
      alt: data.alt,
      mediaType: "image",
      status: "published",
    },
    filePath,
  });
  console.log(`  media created: ${filename} (#${created.id})`);
  return created.id;
}

console.log("seed-wheel-media: connecting…");
const payload = await getPayload();

for (const design of SHOP_WHEEL_DESIGNS) {
  console.log(`model ${design.slug}`);
  const models = await payload.find({
    collection: "wheel-models",
    where: { slug: { equals: design.slug } },
    limit: 1,
    depth: 0,
  });
  const model = models.docs[0];
  if (!model) {
    throw new Error(
      `wheel-model "${design.slug}" missing — run npm run seed:wheel-axis first`,
    );
  }

  const heroPath = wheelFile(design.slug, "hero-3q");
  const mainImage = await ensureMedia(payload, heroPath, {
    title: `${design.name} Hero`,
    alt: design.name,
  });

  const gallery: number[] = [];
  for (const item of GALLERY_VIEWS) {
    const id = await ensureMedia(payload, wheelFile(design.slug, item.view), {
      title: item.title,
      alt: `${design.name}, ${item.altSuffix}`,
    });
    gallery.push(id as number);
  }

  await payload.update({
    collection: "wheel-models",
    id: model.id,
    data: {
      mainImage,
      gallery,
      series: design.finish,
      designStyle: design.positioning,
      shortDescription: design.description,
    },
  });
  console.log(`  linked mainImage + gallery (${gallery.length})`);
}

console.log("Done.");
process.exit(0);
