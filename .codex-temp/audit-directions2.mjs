import { getPayload } from "payload";
import config from "@payload-config";
process.env.S3_BUCKET=""; process.env.S3_ACCESS_KEY_ID=""; process.env.S3_SECRET_ACCESS_KEY="";
const payload = await getPayload({ config });
for (const slug of ["tbr","otr"]) {
  const type = (await payload.find({ collection: "tire-types", where: { slug: { equals: slug } }, limit: 1, depth: false, depth: 0, overrideAccess: true })).docs[0];
  const models = await payload.find({
    collection: "tire-models",
    where: { and: [{ status: { equals: "published" } }, { tireType: { equals: type.id } }] },
    limit: 100,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });
  console.log(slug, "models", models.docs.length, models.docs.slice(0,5).map(m => m.slug));
}
process.exit(0);
