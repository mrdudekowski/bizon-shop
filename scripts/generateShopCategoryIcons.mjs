import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public", "images", "shop", "category-icons");
const originalIcons = [
  ["camping-travel-white.png", "https://s3.twcstorage.ru/bizon-bucket/bizon/media/camping-travel.png"],
  ["car-comfort-white.png", "https://s3.twcstorage.ru/bizon-bucket/bizon/media/car-comfort.png"],
  ["oils-spare-parts-white.png", "https://s3.twcstorage.ru/bizon-bucket/bizon/media/oils-spare-parts.png"],
  ["trailers-white.png", "https://s3.twcstorage.ru/bizon-bucket/bizon/media/trailers.png"],
];

async function recolorOriginalToWhite(filename, url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url}: HTTP ${response.status}`);

  const source = Buffer.from(await response.arrayBuffer());
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let offset = 0; offset < data.length; offset += info.channels) {
    data[offset] = 255;
    data[offset + 1] = 255;
    data[offset + 2] = 255;
  }

  await sharp(data, { raw: info }).png().toFile(path.join(outputDir, filename));
}

const shirtSvg = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <path fill="#fff" d="M96 32 69 43 34 60l18 42 24-10v128h104V92l24 10 18-42-35-17-27-11c-5 14-16 22-32 22s-27-8-32-22Z"/>
  </svg>
`);

await mkdir(outputDir, { recursive: true });

for (const [filename, url] of originalIcons) {
  await recolorOriginalToWhite(filename, url);
  process.stdout.write(`Created white variation from original: ${filename}\n`);
}

const shirtPath = path.join(outputDir, "accessories-shirt-white.png");
await sharp(shirtSvg).png().toFile(shirtPath);
process.stdout.write(`Created new T-shirt icon: ${path.basename(shirtPath)}\n`);
