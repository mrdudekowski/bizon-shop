import { createHash } from "node:crypto";
import {
  PUBLIC_STUB_PAGE_KEYS,
  readArticles,
  readHomePatch,
  readShopCategories,
  readShopHomePatch,
  readShopProducts,
  readStubPatch,
  readTireModelsByType,
  readTireTypes,
  readTireVariants,
  readWheelModelsByType,
  readWheelTypes,
  readWheelVariantsByType,
  type ReadDatabase,
} from "./publishedRead";

export type PublishedContentRevision = {
  schema: 1;
  revision: `sha256:${string}`;
};

async function readPublishedSnapshot(db: ReadDatabase): Promise<unknown> {
  const [home, shopHome, stubs, articles, tireTypes, wheelTypes, shopCategories, shopProducts] = await Promise.all([
    readHomePatch(db),
    readShopHomePatch(db),
    Promise.all(PUBLIC_STUB_PAGE_KEYS.map(async (key) => [key, await readStubPatch(db, key)] as const)),
    readArticles(db),
    readTireTypes(db),
    readWheelTypes(db),
    readShopCategories(db),
    readShopProducts(db),
  ]);

  const tireModels = await Promise.all(tireTypes.map(async (type) => {
    const models = await readTireModelsByType(db, type.slug);
    return Promise.all(models.map(async (model) => ({
      model,
      variants: await readTireVariants(db, model.id),
    })));
  }));
  const wheelModels = await Promise.all(wheelTypes.map(async (type) => ({
    models: await readWheelModelsByType(db, type.slug),
    variants: await readWheelVariantsByType(db, type.slug),
  })));

  return {
    home,
    shopHome,
    stubs,
    articles,
    tires: { types: tireTypes, models: tireModels },
    wheels: { types: wheelTypes, byType: wheelModels },
    shop: { categories: shopCategories, products: shopProducts },
  };
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value != null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export async function readPublishedContentRevision(db: ReadDatabase): Promise<PublishedContentRevision> {
  if (!db.withReadSnapshot) throw new Error("A repeatable-read database snapshot is required");
  const snapshot = await db.withReadSnapshot(readPublishedSnapshot);
  const digest = createHash("sha256").update(canonicalJson(snapshot)).digest("hex");
  return { schema: 1, revision: `sha256:${digest}` };
}
