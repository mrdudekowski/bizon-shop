import { getPayload } from "payload";
import config from "@payload-config";
const payload = await getPayload({ config });
const models = await payload.find({
  collection: "tire-models",
  limit: 10,
  depth: 1,
  overrideAccess: true,
  where: { status: { equals: "published" } },
});
for (const m of models.docs.slice(0, 8)) {
  const img = m.mainImage;
  const url = typeof img === "object" && img ? (img.url || img.filename) : img;
  console.log(m.slug, "->", url);
}
process.exit(0);
