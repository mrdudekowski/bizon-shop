import { getPayload } from "../src/lib/payload/getPayload.ts";

const p = await getPayload();
const media = await p.find({
  collection: "media",
  where: { filename: { like: "bizon-atlas-hero" } },
  limit: 5,
  depth: 0,
});
console.log(
  JSON.stringify(
    media.docs.map((d) => ({
      id: d.id,
      filename: d.filename,
      url: d.url,
      prefix: d.prefix,
      sizes: d.sizes
        ? Object.fromEntries(
            Object.entries(d.sizes).map(([k, v]) => [k, v?.url]),
          )
        : null,
    })),
    null,
    2,
  ),
);
process.exit(0);
