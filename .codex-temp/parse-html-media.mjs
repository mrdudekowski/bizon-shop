import fs from "node:fs";

const temp = process.env.TEMP || process.env.TMP || "/tmp";
const files = process.argv.slice(2);
for (const f of files) {
  const p = `${temp}\\${f}.html`;
  if (!fs.existsSync(p)) {
    console.log(f + ": missing");
    continue;
  }
  const h = fs.readFileSync(p, "utf8");
  const media = [...new Set([...h.matchAll(/\/media\/[^"'\\s&?]+/g)].map((m) => m[0]))];
  const next = [
    ...new Set(
      [...h.matchAll(/url=%2F([^&"]+)/g)].map((m) => decodeURIComponent(m[1])),
    ),
  ].filter((u) => /media|images|png|jpg|webp/i.test(u));
  console.log(f, { mediaCount: media.length, media, imgs: next });
}
