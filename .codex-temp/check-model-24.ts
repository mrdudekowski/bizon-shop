import { getPayload } from "../src/lib/payload/getPayload";
const payload = await getPayload();
const doc = await payload.findByID({ collection: "tire-models", id: 24, depth: 1, overrideAccess: true });
console.log(JSON.stringify({
  id: doc.id,
  status: doc.status,
  tireType: doc.tireType,
  mainImage: doc.mainImage,
  positions: doc.positions,
  applicationTypes: doc.applicationTypes,
  name: doc.name,
  slug: doc.slug,
}, null, 2));
process.exit(0);
