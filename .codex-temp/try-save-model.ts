import { getPayload } from "../src/lib/payload/getPayload";
const payload = await getPayload();
try {
  const updated = await payload.update({
    collection: "tire-models",
    id: 24,
    data: { shortDescription: "test save " + Date.now() },
    overrideAccess: true,
  });
  console.log("SAVE_OK", { id: updated.id, status: updated.status, shortDescription: updated.shortDescription });
} catch (e) {
  console.log("SAVE_FAIL", e instanceof Error ? e.message : String(e));
}
process.exit(0);
