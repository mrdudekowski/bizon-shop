import { getPayload } from "payload";
import config from "@payload-config";
const payload = await getPayload({ config });
const types = await payload.find({ collection: "tire-types", limit: 20, depth: false, depth: 0, overrideAccess: true });
console.log("types", types.docs.map(t => ({ slug: t.slug, name: t.name, status: t.status, sort: t.sortOrder })));
const models = await payload.find({ collection: "tire-models", limit: 5, depth: false, depth: 0, overrideAccess: true, sort: "-updatedAt" });
console.log("modelFields sample", Object.keys(models.docs[0] || {}));
process.exit(0);
