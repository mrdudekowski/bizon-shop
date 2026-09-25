/**
 * Staging CMS smoke: schema + publish gates + site mappers.
 * Run: DATABASE_URI=... payload run .codex-temp/cms-smoke.mjs
 */
import { getPayload } from "../src/lib/payload/getPayload.ts";
import { mapTireModelDetail, mapWheelModelDetail } from "../src/lib/cms/payload/mappers.ts";
import { toForgedWheelView } from "../src/components/shop/forgedView.ts";

const findings = [];
function ok(msg) {
  findings.push({ level: "ok", msg });
}
function warn(msg) {
  findings.push({ level: "warn", msg });
}
function bad(msg) {
  findings.push({ level: "bad", msg });
}

const payload = await getPayload();
const collections = Object.keys(payload.collections).sort();

if (collections.includes("model-features")) bad("model-features still registered");
else ok("model-features not registered");

for (const need of [
  "tire-types",
  "tire-models",
  "tire-variants",
  "wheel-types",
  "wheel-models",
  "wheel-variants",
  "media",
  "products",
]) {
  if (collections.includes(need)) ok(`collection: ${need}`);
  else bad(`missing collection: ${need}`);
}

function collectNames(fields, out = []) {
  for (const field of fields ?? []) {
    if (field?.name) out.push(field.name);
    if (field?.type === "tabs") {
      for (const tab of field.tabs ?? []) collectNames(tab.fields, out);
    }
    if (field?.type === "row" || field?.type === "group" || field?.type === "collapsible") {
      collectNames(field.fields, out);
    }
    if (field?.type === "array") collectNames(field.fields, out);
  }
  return out;
}

const tireFields = collectNames(payload.collections["tire-models"].config.fields);
const wheelFields = collectNames(payload.collections["wheel-models"].config.fields);

for (const dead of ["catalogId", "verificationStatus", "publishBlocked", "sourceSnapshot", "advantages", "applicationCategory"]) {
  if (tireFields.includes(dead)) bad(`tire-models still has field ${dead}`);
  else ok(`tire-models has no ${dead}`);
}
if (tireFields.includes("features")) ok("tire-models has features");
else bad("tire-models missing features");
if (tireFields.includes("applicationTypes")) ok("tire-models has applicationTypes");
else warn("tire-models missing applicationTypes");
if (tireFields.includes("mainImage")) ok("tire-models has mainImage");
else bad("tire-models missing mainImage");

if (wheelFields.includes("mainImage") && wheelFields.includes("gallery")) {
  ok("wheel-models has mainImage + gallery");
} else bad("wheel-models missing mainImage/gallery");

// Publish gate: tire model without mainImage must fail when publishing
const tbr = await payload.find({
  collection: "tire-types",
  where: { slug: { equals: "tbr" } },
  limit: 1,
});
const tireTypeId = tbr.docs[0]?.id;
if (!tireTypeId) bad("no tbr tire-type for gate test");
else {
  const stamp = Date.now();
  const draft = await payload.create({
    collection: "tire-models",
    data: {
      name: `CMS Smoke ${stamp}`,
      slug: `cms-smoke-${stamp}`,
      tireType: tireTypeId,
      status: "draft",
      shortDescription: "smoke draft",
    },
  });
  ok(`created draft tire-model #${draft.id}`);

  let blocked = false;
  try {
    await payload.update({
      collection: "tire-models",
      id: draft.id,
      data: { status: "published" },
    });
  } catch (error) {
    blocked = true;
    const message = error instanceof Error ? error.message : String(error);
    if (/изображен|mainImage|главн/i.test(message)) {
      ok(`publish gate blocks model without mainImage: ${message.slice(0, 120)}`);
    } else {
      warn(`publish blocked but unexpected message: ${message.slice(0, 160)}`);
    }
  }
  if (!blocked) bad("publish gate DID NOT block tire-model without mainImage");

  await payload.delete({ collection: "tire-models", id: draft.id });
  ok("cleaned smoke tire-model");
}

// Site mapping samples
const publishedTires = await payload.find({
  collection: "tire-models",
  where: { status: { equals: "published" } },
  limit: 5,
  depth: 2,
});
const withImage = publishedTires.docs.filter((d) => d.mainImage);
const withFeatures = publishedTires.docs.filter((d) => Array.isArray(d.features) && d.features.length > 0);
ok(`published tire-models: ${publishedTires.totalDocs} (sample ${publishedTires.docs.length}, with mainImage ${withImage.length}, with features ${withFeatures.length})`);

if (withImage[0]) {
  const mapped = mapTireModelDetail(withImage[0]);
  if (mapped.imageUrl) ok(`tire mapper imageUrl ok for ${mapped.slug}`);
  else bad(`tire mapper missing imageUrl for ${mapped.slug}`);
  if (Array.isArray(mapped.advantages)) ok(`tire features→advantages count ${mapped.advantages.length}`);
  else bad("tire mapper missing advantages from features");
}

const publishedWheels = await payload.find({
  collection: "wheel-models",
  where: { status: { equals: "published" } },
  limit: 10,
  depth: 2,
});
ok(`published wheel-models: ${publishedWheels.totalDocs}`);
let forgedViews = 0;
for (const doc of publishedWheels.docs) {
  const mapped = mapWheelModelDetail(doc);
  const view = toForgedWheelView(mapped);
  if (view) {
    forgedViews += 1;
    if (view.gallery.length < 3) warn(`${mapped.slug}: gallery ${view.gallery.length} < 3`);
  } else if (mapped.wheelTypeSlug === "forged") {
    bad(`forged ${mapped.slug} published but toForgedWheelView null (no imageUrl)`);
  }
}
ok(`forged views mappable: ${forgedViews}`);

// Old admin filter risk
const nav = await import("../src/lib/catalog/catalogNav.ts");
const tireAxis = nav.CATALOG_AXES?.find?.((a) => a.id === "tires") ?? nav.default?.find?.((a) => a.id === "tires");
const axes = nav.CATALOG_AXES ?? nav.catalogAxes ?? Object.values(nav).find((v) => Array.isArray(v) && v[0]?.id);
const tires = (axes || []).find((a) => a.id === "tires" || a.label?.includes?.("шин"));
const stale = tires?.steps?.some((s) => s.filterField === "applicationCategory" || s.id === "applicationCategory");
if (stale) bad("admin catalogNav still filters by applicationCategory (dead field)");
else ok("admin catalogNav has no applicationCategory filter");

console.log(JSON.stringify({ collections, findings }, null, 2));
const failed = findings.some((f) => f.level === "bad");
process.exit(failed ? 1 : 0);
