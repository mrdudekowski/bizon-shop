/**
 * Seeds TireTypes (TBR, OTR) and links existing TireModels to TBR.
 *
 * Run: npm run seed:tire-axis
 * Requires DATABASE_URI and running Postgres.
 */
import { getPayload } from "../src/lib/payload/getPayload";
import type { TireType } from "../src/payload-types";

const TIRE_TYPE_SEEDS = [
  {
    slug: "tbr",
    name: "TBR — грузовые шины",
    description: "Radial truck tyres for highways and regional routes.",
    shortDescription: "Магистральные и региональные грузовые шины",
    sortOrder: 0,
    showInMenu: true,
    selectionVehicleTypes: [
      "long-haul-tractor",
      "regional-truck",
      "construction-dumper",
    ] as TireType["selectionVehicleTypes"],
    selectionConditions: [
      "long-haul",
      "regional",
      "mixed",
    ] as TireType["selectionConditions"],
    status: "published" as const,
  },
  {
    slug: "otr",
    name: "OTR — карьер и спецтехника",
    description: "Off-the-road tyres for quarries and heavy equipment.",
    shortDescription: "Карьерные и внедорожные шины",
    sortOrder: 1,
    showInMenu: true,
    selectionVehicleTypes: [
      "construction-dumper",
      "quarry-special",
    ] as TireType["selectionVehicleTypes"],
    selectionConditions: [
      "mixed",
      "off-road",
    ] as TireType["selectionConditions"],
    status: "published" as const,
  },
];

async function upsertTireType(
  payload: Awaited<ReturnType<typeof getPayload>>,
  seed: (typeof TIRE_TYPE_SEEDS)[number],
) {
  const existing = await payload.find({
    collection: "tire-types",
    where: { slug: { equals: seed.slug } },
    limit: 1,
    depth: 0,
  });

  if (existing.docs[0]) {
    const updated = await payload.update({
      collection: "tire-types",
      id: existing.docs[0].id,
      data: seed,
    });
    console.log(`Updated tire-type: ${seed.slug} (id ${updated.id})`);
    return updated.id;
  }

  const created = await payload.create({
    collection: "tire-types",
    data: seed,
  });
  console.log(`Created tire-type: ${seed.slug} (id ${created.id})`);
  return created.id;
}

console.log("seed-tire-axis: connecting…");

const payload = await getPayload();

const typeIds: Record<string, number> = {};

for (const seed of TIRE_TYPE_SEEDS) {
  typeIds[seed.slug] = await upsertTireType(payload, seed);
}

const tbrId = typeIds.tbr;
if (!tbrId) {
  throw new Error("TBR tire type id missing after seed");
}

const models = await payload.find({
  collection: "tire-models",
  limit: 500,
  depth: 0,
});

let linked = 0;
for (const model of models.docs) {
  if (model.tireType) continue;

  await payload.update({
    collection: "tire-models",
    id: model.id,
    data: {
      tireType: tbrId,
    },
  });
  linked += 1;
  console.log(`Linked model ${model.slug} → TBR`);
}

console.log(`Done. Tire types: ${TIRE_TYPE_SEEDS.length}, models linked: ${linked}`);
process.exit(0);
