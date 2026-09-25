console.log("verify-db: start");

import { getPayload } from "../src/lib/payload/getPayload";

const payload = await getPayload();

const [
  types,
  models,
  variants,
  users,
  shopCategories,
  products,
  wheelTypes,
  wheelModels,
  wheelVariants,
  tireIqArticles,
  peopleStories,
] = await Promise.all([
  payload.find({ collection: "tire-types", limit: 10, depth: 0 }),
  payload.find({ collection: "tire-models", limit: 0, depth: 0 }),
  payload.find({ collection: "tire-variants", limit: 0, depth: 0 }),
  payload.find({ collection: "users", limit: 0, depth: 0 }),
  payload.find({ collection: "shop-categories", limit: 0, depth: 0 }),
  payload.find({ collection: "products", limit: 0, depth: 0 }),
  payload.find({ collection: "wheel-types", limit: 10, depth: 0 }),
  payload.find({ collection: "wheel-models", limit: 0, depth: 0 }),
  payload.find({ collection: "wheel-variants", limit: 0, depth: 0 }),
  payload.find({ collection: "tire-iq-articles", limit: 0, depth: 0 }),
  payload.find({ collection: "people-stories", limit: 0, depth: 0 }),
]);

const summary = {
  ok: true,
  tireTypes: types.totalDocs,
  tireTypeSlugs: types.docs.map((d) => d.slug),
  tireModels: models.totalDocs,
  tireVariants: variants.totalDocs,
  users: users.totalDocs,
  shopCategories: shopCategories.totalDocs,
  products: products.totalDocs,
  wheelTypes: wheelTypes.totalDocs,
  wheelTypeSlugs: wheelTypes.docs.map((d) => d.slug),
  wheelModels: wheelModels.totalDocs,
  wheelVariants: wheelVariants.totalDocs,
  tireIqArticles: tireIqArticles.totalDocs,
  peopleStories: peopleStories.totalDocs,
};

console.log(JSON.stringify(summary, null, 2));

if (summary.tireTypes < 1 || summary.shopCategories < 1) {
  console.error("verify-db: expected seeded tire types and shop categories");
  process.exit(1);
}

process.exit(0);
