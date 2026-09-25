/**
 * Import catalog rows from import-templates/*.csv (upsert by slug / sku).
 *
 *   npm run import:catalog
 *   npm run import:catalog -- --dry-run
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Payload } from "payload";

import { getPayload } from "../src/lib/payload/getPayload";
import { parseCsv, readCsvFile } from "./lib/csv";

const csvSelfCheck = parseCsv('a,b\n"hello, world",2');
if (csvSelfCheck.length !== 1 || csvSelfCheck[0].a !== "hello, world" || csvSelfCheck[0].b !== "2") {
  throw new Error("csv self-check failed");
}

const TEMPLATES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../import-templates");
const dryRun = process.env.DRY_RUN === "1" || process.argv.includes("--dry-run");

type CsvRow = Record<string, string>;

type ImportStats = {
  created: number;
  updated: number;
  failed: number;
  errors: string[];
};

function emptyStats(): ImportStats {
  return { created: 0, updated: 0, failed: 0, errors: [] };
}

function mergeStats(target: ImportStats, source: ImportStats): void {
  target.created += source.created;
  target.updated += source.updated;
  target.failed += source.failed;
  target.errors.push(...source.errors);
}

function asBool(value: string | undefined): boolean | undefined {
  if (value == null || value === "") return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function asNum(value: string | undefined): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asStatus(value: string | undefined): "draft" | "published" | "archived" {
  if (value === "draft" || value === "archived") return value;
  return "published";
}

function pickDefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== "") {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

function requireFields(row: CsvRow, fields: string[], rowLabel: string): string | null {
  for (const field of fields) {
    if (!row[field]?.trim()) {
      return `${rowLabel}: missing required field "${field}"`;
    }
  }
  return null;
}

async function findIdBySlug(
  payload: Payload,
  collection: Parameters<Payload["find"]>[0]["collection"],
  slug: string,
): Promise<number | null> {
  const result = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  });
  return result.docs[0]?.id ?? null;
}

async function upsertBySlug(
  payload: Payload,
  collection: Parameters<Payload["create"]>[0]["collection"],
  slug: string,
  data: Record<string, unknown>,
  stats: ImportStats,
  rowLabel: string,
): Promise<void> {
  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  });

  if (dryRun) {
    console.log(`[dry-run] ${existing.docs[0] ? "update" : "create"} ${collection} ${slug}`);
    if (existing.docs[0]) stats.updated += 1;
    else stats.created += 1;
    return;
  }

  try {
    if (existing.docs[0]) {
      await payload.update({
        collection,
        id: existing.docs[0].id,
        data,
      } as Parameters<Payload["update"]>[0]);
      stats.updated += 1;
      console.log(`Updated ${collection}: ${slug}`);
      return;
    }

    await payload.create({
      collection,
      data: { slug, ...data },
    } as Parameters<Payload["create"]>[0]);
    stats.created += 1;
    console.log(`Created ${collection}: ${slug}`);
  } catch (error) {
    stats.failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    stats.errors.push(`${rowLabel}: ${message}`);
    console.error(`Failed ${collection} ${slug}: ${message}`);
  }
}

async function importTireTypes(payload: Payload, rows: CsvRow[]): Promise<ImportStats> {
  const stats = emptyStats();

  for (const [index, row] of rows.entries()) {
    const rowLabel = `tire-types row ${index + 2}`;
    const missing = requireFields(row, ["slug", "name"], rowLabel);
    if (missing) {
      stats.failed += 1;
      stats.errors.push(missing);
      continue;
    }

    const data = pickDefined({
      name: row.name,
      description: row.description,
      shortDescription: row.shortDescription,
      sortOrder: asNum(row.sortOrder),
      showInMenu: asBool(row.showInMenu),
      status: asStatus(row.status),
    });

    await upsertBySlug(payload, "tire-types", row.slug.trim(), data, stats, rowLabel);
  }

  return stats;
}

async function importTireModels(payload: Payload, rows: CsvRow[]): Promise<ImportStats> {
  const stats = emptyStats();

  for (const [index, row] of rows.entries()) {
    const rowLabel = `tire-models row ${index + 2}`;
    const missing = requireFields(
      row,
      ["slug", "name", "tireTypeSlug", "applicationCategory"],
      rowLabel,
    );
    if (missing) {
      stats.failed += 1;
      stats.errors.push(missing);
      continue;
    }

    const tireTypeId = await findIdBySlug(payload, "tire-types", row.tireTypeSlug.trim());
    if (!tireTypeId) {
      stats.failed += 1;
      stats.errors.push(`${rowLabel}: unknown tireTypeSlug "${row.tireTypeSlug}"`);
      continue;
    }

    const data = pickDefined({
      name: row.name,
      tireType: tireTypeId,
      applicationCategory: row.applicationCategory,
      series: row.series,
      application: row.application,
      axlePosition: row.axlePosition,
      treadType: row.treadType,
      shortDescription: row.shortDescription,
      status: asStatus(row.status),
    });

    await upsertBySlug(payload, "tire-models", row.slug.trim(), data, stats, rowLabel);
  }

  return stats;
}

async function importTireVariants(payload: Payload, rows: CsvRow[]): Promise<ImportStats> {
  const stats = emptyStats();

  for (const [index, row] of rows.entries()) {
    const rowLabel = `tire-variants row ${index + 2}`;
    const missing = requireFields(row, ["modelSlug", "size"], rowLabel);
    if (missing) {
      stats.failed += 1;
      stats.errors.push(missing);
      continue;
    }

    const modelId = await findIdBySlug(payload, "tire-models", row.modelSlug.trim());
    if (!modelId) {
      stats.failed += 1;
      stats.errors.push(`${rowLabel}: unknown modelSlug "${row.modelSlug}"`);
      continue;
    }

    const existing = await payload.find({
      collection: "tire-variants",
      where: {
        and: [
          { tireModel: { equals: modelId } },
          { size: { equals: row.size.trim() } },
        ],
      },
      limit: 1,
      depth: 0,
    });

    const data = pickDefined({
      tireModel: modelId,
      size: row.size.trim(),
      rimDiameter: asNum(row.rimDiameter),
      loadIndex: row.loadIndex,
      speedIndex: row.speedIndex,
      plyRating: row.plyRating,
      overallDiameter: asNum(row.overallDiameter),
      weight: asNum(row.weight),
      recommendedRim: row.recommendedRim,
      available: asBool(row.available),
      priceOnRequest: asBool(row.priceOnRequest),
      sortOrder: asNum(row.sortOrder),
      status: asStatus(row.status),
    });

    const label = `${row.modelSlug}/${row.size}`;

    if (dryRun) {
      console.log(`[dry-run] ${existing.docs[0] ? "update" : "create"} tire-variants ${label}`);
      if (existing.docs[0]) stats.updated += 1;
      else stats.created += 1;
      continue;
    }

    try {
      if (existing.docs[0]) {
        await payload.update({
          collection: "tire-variants",
          id: existing.docs[0].id,
          data,
        } as Parameters<Payload["update"]>[0]);
        stats.updated += 1;
        console.log(`Updated tire-variants: ${label}`);
      } else {
        await payload.create({
          collection: "tire-variants",
          data,
        } as Parameters<Payload["create"]>[0]);
        stats.created += 1;
        console.log(`Created tire-variants: ${label}`);
      }
    } catch (error) {
      stats.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      stats.errors.push(`${rowLabel}: ${message}`);
      console.error(`Failed tire-variants ${label}: ${message}`);
    }
  }

  return stats;
}

async function importWheelTypes(payload: Payload, rows: CsvRow[]): Promise<ImportStats> {
  const stats = emptyStats();

  for (const [index, row] of rows.entries()) {
    const rowLabel = `wheel-types row ${index + 2}`;
    const missing = requireFields(row, ["slug", "name"], rowLabel);
    if (missing) {
      stats.failed += 1;
      stats.errors.push(missing);
      continue;
    }

    const data = pickDefined({
      name: row.name,
      description: row.description,
      shortDescription: row.shortDescription,
      sortOrder: asNum(row.sortOrder),
      status: asStatus(row.status),
    });

    await upsertBySlug(payload, "wheel-types", row.slug.trim(), data, stats, rowLabel);
  }

  return stats;
}

async function importWheelModels(payload: Payload, rows: CsvRow[]): Promise<ImportStats> {
  const stats = emptyStats();

  for (const [index, row] of rows.entries()) {
    const rowLabel = `wheel-models row ${index + 2}`;
    const missing = requireFields(row, ["slug", "name", "wheelTypeSlug"], rowLabel);
    if (missing) {
      stats.failed += 1;
      stats.errors.push(missing);
      continue;
    }

    const wheelTypeId = await findIdBySlug(payload, "wheel-types", row.wheelTypeSlug.trim());
    if (!wheelTypeId) {
      stats.failed += 1;
      stats.errors.push(`${rowLabel}: unknown wheelTypeSlug "${row.wheelTypeSlug}"`);
      continue;
    }

    const data = pickDefined({
      name: row.name,
      wheelType: wheelTypeId,
      series: row.series,
      designStyle: row.designStyle,
      material: row.material,
      constructionMethod: row.constructionMethod,
      shortDescription: row.shortDescription,
      status: asStatus(row.status),
    });

    await upsertBySlug(payload, "wheel-models", row.slug.trim(), data, stats, rowLabel);
  }

  return stats;
}

async function importWheelVariants(payload: Payload, rows: CsvRow[]): Promise<ImportStats> {
  const stats = emptyStats();

  for (const [index, row] of rows.entries()) {
    const rowLabel = `wheel-variants row ${index + 2}`;
    const missing = requireFields(row, ["modelSlug", "sizeLabel"], rowLabel);
    if (missing) {
      stats.failed += 1;
      stats.errors.push(missing);
      continue;
    }

    const modelId = await findIdBySlug(payload, "wheel-models", row.modelSlug.trim());
    if (!modelId) {
      stats.failed += 1;
      stats.errors.push(`${rowLabel}: unknown modelSlug "${row.modelSlug}"`);
      continue;
    }

    let existing = row.sku?.trim()
      ? await payload.find({
          collection: "wheel-variants",
          where: { sku: { equals: row.sku.trim() } },
          limit: 1,
          depth: 0,
        })
      : { docs: [] as { id: number }[] };

    if (!existing.docs[0]) {
      existing = await payload.find({
        collection: "wheel-variants",
        where: {
          and: [
            { wheelModel: { equals: modelId } },
            { sizeLabel: { equals: row.sizeLabel.trim() } },
          ],
        },
        limit: 1,
        depth: 0,
      });
    }

    const data = pickDefined({
      wheelModel: modelId,
      sizeLabel: row.sizeLabel.trim(),
      sku: row.sku,
      diameter: asNum(row.diameter),
      width: asNum(row.width),
      boltHoles: asNum(row.boltHoles),
      pcd: row.pcd,
      offsetET: asNum(row.offsetET),
      centerBore: asNum(row.centerBore),
      loadRating: row.loadRating,
      color: row.color,
      finish: row.finish,
      available: asBool(row.available),
      priceOnRequest: asBool(row.priceOnRequest),
      sortOrder: asNum(row.sortOrder),
      status: asStatus(row.status),
    });

    const label = row.sku?.trim() || `${row.modelSlug}/${row.sizeLabel}`;

    if (dryRun) {
      console.log(`[dry-run] ${existing.docs[0] ? "update" : "create"} wheel-variants ${label}`);
      if (existing.docs[0]) stats.updated += 1;
      else stats.created += 1;
      continue;
    }

    try {
      if (existing.docs[0]) {
        await payload.update({
          collection: "wheel-variants",
          id: existing.docs[0].id,
          data,
        } as Parameters<Payload["update"]>[0]);
        stats.updated += 1;
        console.log(`Updated wheel-variants: ${label}`);
      } else {
        await payload.create({
          collection: "wheel-variants",
          data,
        } as Parameters<Payload["create"]>[0]);
        stats.created += 1;
        console.log(`Created wheel-variants: ${label}`);
      }
    } catch (error) {
      stats.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      stats.errors.push(`${rowLabel}: ${message}`);
      console.error(`Failed wheel-variants ${label}: ${message}`);
    }
  }

  return stats;
}

async function importShopCategories(payload: Payload, rows: CsvRow[]): Promise<ImportStats> {
  const stats = emptyStats();

  for (const [index, row] of rows.entries()) {
    const rowLabel = `shop-categories row ${index + 2}`;
    const missing = requireFields(row, ["slug", "name"], rowLabel);
    if (missing) {
      stats.failed += 1;
      stats.errors.push(missing);
      continue;
    }

    const data = pickDefined({
      name: row.name,
      description: row.description,
      sortOrder: asNum(row.sortOrder),
      showInMenu: asBool(row.showInMenu),
      showOnShopHome: asBool(row.showOnShopHome),
      status: asStatus(row.status),
    });

    await upsertBySlug(payload, "shop-categories", row.slug.trim(), data, stats, rowLabel);
  }

  return stats;
}

async function importShopProducts(payload: Payload, rows: CsvRow[]): Promise<ImportStats> {
  const stats = emptyStats();

  for (const [index, row] of rows.entries()) {
    const rowLabel = `shop-products row ${index + 2}`;
    const missing = requireFields(row, ["slug", "name", "shopCategorySlug"], rowLabel);
    if (missing) {
      stats.failed += 1;
      stats.errors.push(missing);
      continue;
    }

    const categoryId = await findIdBySlug(payload, "shop-categories", row.shopCategorySlug.trim());
    if (!categoryId) {
      stats.failed += 1;
      stats.errors.push(`${rowLabel}: unknown shopCategorySlug "${row.shopCategorySlug}"`);
      continue;
    }

    const data = pickDefined({
      name: row.name,
      shopCategory: categoryId,
      shortDescription: row.shortDescription,
      priceOnRequest: asBool(row.priceOnRequest),
      status: asStatus(row.status),
    });

    await upsertBySlug(payload, "products", row.slug.trim(), data, stats, rowLabel);
  }

  return stats;
}


type ImportStep = {
  file: string;
  run: (payload: Payload, rows: CsvRow[]) => Promise<ImportStats>;
};

const STEPS: ImportStep[] = [
  { file: "tire-types.csv", run: importTireTypes },
  { file: "tire-models.csv", run: importTireModels },
  { file: "tire-variants.csv", run: importTireVariants },
  { file: "wheel-types.csv", run: importWheelTypes },
  { file: "wheel-models.csv", run: importWheelModels },
  { file: "wheel-variants.csv", run: importWheelVariants },
  { file: "shop-categories.csv", run: importShopCategories },
  { file: "shop-products.csv", run: importShopProducts },
];

console.log(`import-catalog: connecting…${dryRun ? " (dry-run)" : ""}`);

const payload = await getPayload();
const totals = emptyStats();

for (const step of STEPS) {
  const filePath = path.join(TEMPLATES_DIR, step.file);
  const rows = readCsvFile(filePath);
  console.log(`\n→ ${step.file} (${rows.length} rows)`);
  const stats = await step.run(payload, rows);
  mergeStats(totals, stats);
}

console.log(
  `\nDone. created=${totals.created} updated=${totals.updated} failed=${totals.failed}`,
);

if (totals.errors.length > 0) {
  console.error("\nErrors:");
  for (const error of totals.errors) {
    console.error(`  - ${error}`);
  }
}

if (totals.failed > 0) {
  process.exit(1);
}

process.exit(0);
