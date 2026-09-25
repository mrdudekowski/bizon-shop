import { getPayload } from "payload";
import config from "@payload-config";
const payload = await getPayload({ config });
const models = await payload.find({ collection: "tire-models", limit: 5, depth: false, depth: 1, overrideAccess: true });
for (const m of models.docs) {
  const img = m.mainImage;
  const url = typeof img === "object" && img ? img.url || img.filename : img;
  console.log(m.slug, "->", url);
}
process.exit(0);
