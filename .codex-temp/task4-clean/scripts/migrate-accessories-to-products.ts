/**
 * One-off: copy rows from legacy `accessories` table into `products`.
 * Safe to run after removing the collection from payload.config.
 *
 *   npm run payload run scripts/migrate-accessories-to-products.ts
 */
// @ts-nocheck — one-off migration; legacy row shapes from raw SQL
import { getPayload } from "../src/lib/payload/getPayload";

type LegacyAccessory = {
  id: number;
  slug: string;
  name: string;
  category?: number | { id: number } | null;
  description?: unknown;
  color?: string | null;
  size?: string | null;
  material?: string | null;
  price?: number | null;
  priceOnRequest?: boolean | null;
  mainImage?: number | null;
  gallery?: number[] | null;
  instructions?: number[] | null;
  seo?: Record<string, unknown> | null;
  status?: string | null;
  publishedAt?: string | null;
};

function relationId(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id: unknown }).id;
    if (typeof id === "number") return id;
  }
  return undefined;
}

console.log("migrate-accessories-to-products: connecting…");
const payload = await getPayload();

let accessories: LegacyAccessory[] = [];

try {
  const result = await payload.db.drizzle.execute("SELECT * FROM accessories ORDER BY id");
  accessories = (result.rows ?? []) as LegacyAccessory[];
} catch (error) {
  const code = (error as { cause?: { code?: string } }).cause?.code;
  if (code === "42P01") {
    console.log("No accessories table — nothing to migrate.");
    process.exit(0);
  }
  throw error;
}

console.log(`Found ${accessories.length} accessory row(s).`);

let migrated = 0;
let skipped = 0;

for (const row of accessories) {
  const shopCategory = relationId(row.category);
  if (!shopCategory) {
    console.warn(`Skip id=${row.id} (${row.slug}): no shopCategory`);
    skipped++;
    continue;
  }

  const existing = await payload.find({
    collection: "products",
    where: { slug: { equals: row.slug } },
    limit: 1,
    depth: 0,
  });

  const data = {
    name: row.name,
    slug: row.slug,
    shopCategory,
    fullDescription: row.description ?? undefined,
    color: row.color ?? undefined,
    size: row.size ?? undefined,
    material: row.material ?? undefined,
    price: row.price ?? undefined,
    priceOnRequest: row.priceOnRequest ?? true,
    mainImage: row.mainImage ?? undefined,
    gallery: row.gallery ?? undefined,
    instructions: row.instructions ?? undefined,
    seo: row.seo ?? undefined,
    status: (row.status as "draft" | "published" | "archived") ?? "draft",
    publishedAt: row.publishedAt ?? undefined,
  } as Record<string, unknown>;

  if (existing.docs[0]) {
    await payload.update({ collection: "products", id: existing.docs[0].id, data });
    console.log(`Updated product: ${row.slug}`);
  } else {
    await payload.create({ collection: "products", data });
    console.log(`Created product: ${row.slug}`);
  }
  migrated++;
}

console.log(`Done. migrated=${migrated} skipped=${skipped}`);
if (accessories.length === migrated + skipped) {
  console.log("Self-check OK.");
}

process.exit(0);
