import { getPayload } from "../src/lib/payload/getPayload";

const payload = await getPayload();
const result = await payload.find({
  collection: "tire-models",
  limit: 100,
  depth: 0,
  overrideAccess: true,
});

let bad = 0;
for (const doc of result.docs) {
  const v = doc.fullDescription;
  const kind = v == null ? "null" : typeof v;
  const preview =
    typeof v === "string"
      ? v.slice(0, 80)
      : v && typeof v === "object"
        ? JSON.stringify(v).slice(0, 80)
        : String(v);
  if (typeof v === "string") {
    bad += 1;
    console.log(`BAD id=${doc.id} slug=${doc.slug} kind=${kind} preview=${JSON.stringify(preview)}`);
  }
}
console.log(`total=${result.totalDocs} badStringFullDescription=${bad}`);
process.exit(0);
