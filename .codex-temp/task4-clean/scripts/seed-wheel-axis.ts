/**
 * Bootstraps WheelTypes (forged) and approved forged designs from SHOP_WHEEL_DESIGNS.
 *
 * Run: npm run seed:wheel-axis
 * ponytail: mainImage stays empty until npm run seed:wheel-media uploads PNGs.
 */
import { SHOP_WHEEL_DESIGNS } from "../src/constants/shopWheels";
import { getPayload } from "../src/lib/payload/getPayload";

const FORGED_TYPE = {
  slug: "forged",
  name: "Кованые диски",
  description: "Кованые диски BIZON для грузового и коммерческого транспорта.",
  shortDescription: "Высокопрочные кованые диски",
  sortOrder: 0,
  status: "published" as const,
};

console.log("seed-wheel-axis: connecting…");

const payload = await getPayload();

const existingType = await payload.find({
  collection: "wheel-types",
  where: { slug: { equals: FORGED_TYPE.slug } },
  limit: 1,
  depth: 0,
});

let forgedTypeId = existingType.docs[0]?.id;
if (forgedTypeId) {
  await payload.update({
    collection: "wheel-types",
    id: forgedTypeId,
    data: FORGED_TYPE,
  });
  console.log(`Updated wheel-type: ${FORGED_TYPE.slug}`);
} else {
  const created = await payload.create({
    collection: "wheel-types",
    data: FORGED_TYPE,
  });
  forgedTypeId = created.id;
  console.log(`Created wheel-type: ${FORGED_TYPE.slug}`);
}

for (const design of SHOP_WHEEL_DESIGNS) {
  const existingModel = await payload.find({
    collection: "wheel-models",
    where: { slug: { equals: design.slug } },
    limit: 1,
    depth: 0,
  });

  const modelData = {
    name: design.name,
    slug: design.slug,
    wheelType: forgedTypeId,
    designStyle: design.positioning,
    series: design.finish,
    material: "Кованый алюминий",
    constructionMethod: "forged" as const,
    shortDescription: design.description,
    status: "published" as const,
  };

  if (existingModel.docs[0]) {
    await payload.update({
      collection: "wheel-models",
      id: existingModel.docs[0].id,
      data: modelData,
    });
    console.log(`Updated wheel-model: ${design.slug}`);
  } else {
    await payload.create({
      collection: "wheel-models",
      data: modelData,
    });
    console.log(`Created wheel-model: ${design.slug}`);
  }
}

console.log("Done. Run npm run seed:wheel-media to upload mainImage and gallery.");
process.exit(0);
