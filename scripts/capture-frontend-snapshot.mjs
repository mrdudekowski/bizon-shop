import fs from "node:fs";
import path from "node:path";

const API = "http://127.0.0.1:4000";
const root = path.resolve(import.meta.dirname, "..");
const mediaDir = path.join(root, "public", "snapshot-media");
const snapshotDir = path.join(root, "src", "lib", "content", "snapshot");
const STUB_PAGES = [
  "about",
  "contact",
  "warranty",
  "branding",
  "become-a-supplier",
  "privacy-policy",
  "shop-delivery-returns",
];

const responses = {};
const urlToLocal = new Map();
const missing = [];

async function readJson(urlPath) {
  const response = await fetch(`${API}${urlPath}`);
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error(`${response.status} ${urlPath}`);
  return response.json();
}

function remember(urlPath, body) {
  if (body !== undefined) responses[urlPath] = body;
}

function fileNameFor(remoteUrl) {
  const parsed = new URL(remoteUrl);
  const base = path.basename(parsed.pathname) || "file";
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe.length > 0 ? safe : "file";
}

async function localizeUrl(remoteUrl) {
  if (urlToLocal.has(remoteUrl)) return urlToLocal.get(remoteUrl);
  const filename = fileNameFor(remoteUrl);
  let localName = filename;
  const existing = [...urlToLocal.entries()].find(([, local]) => local.endsWith(`/${filename}`));
  if (existing && existing[0] !== remoteUrl) {
    const stamp = Buffer.from(remoteUrl).toString("hex").slice(0, 8);
    const extension = path.extname(filename);
    localName = `${path.basename(filename, extension)}-${stamp}${extension}`;
  }
  const localPath = `/snapshot-media/${localName}`;
  urlToLocal.set(remoteUrl, localPath);
  const target = path.join(mediaDir, localName);
  if (!fs.existsSync(target)) {
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      missing.push({ remoteUrl, status: response.status });
      urlToLocal.set(remoteUrl, remoteUrl);
      return remoteUrl;
    }
    fs.writeFileSync(target, Buffer.from(await response.arrayBuffer()));
  }
  return localPath;
}

async function rewrite(value) {
  if (typeof value === "string") {
    if (value.startsWith("https://") || value.startsWith("http://")) {
      return localizeUrl(value);
    }
    return value;
  }
  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => rewrite(item)));
  }
  if (value && typeof value === "object") {
    const next = {};
    for (const [key, item] of Object.entries(value)) {
      next[key] = await rewrite(item);
    }
    return next;
  }
  return value;
}

const tireTypes = await readJson("/v1/tires/types");
remember("/v1/tires/types", tireTypes);
for (const type of tireTypes ?? []) {
  remember(`/v1/tires/types/${type.slug}`, await readJson(`/v1/tires/types/${type.slug}`));
  const models = await readJson(`/v1/tires/types/${type.slug}/models`);
  remember(`/v1/tires/types/${type.slug}/models`, models);
  for (const model of models ?? []) {
    remember(
      `/v1/tires/models/${type.slug}/${model.slug}`,
      await readJson(`/v1/tires/models/${type.slug}/${model.slug}`),
    );
    remember(
      `/v1/tires/models/${model.id}/variants`,
      await readJson(`/v1/tires/models/${model.id}/variants`),
    );
  }
}

const wheelTypes = await readJson("/v1/wheels/types");
remember("/v1/wheels/types", wheelTypes);
for (const type of wheelTypes ?? []) {
  remember(`/v1/wheels/types/${type.slug}`, await readJson(`/v1/wheels/types/${type.slug}`));
  const models = await readJson(`/v1/wheels/types/${type.slug}/models`);
  remember(`/v1/wheels/types/${type.slug}/models`, models);
  remember(
    `/v1/wheels/types/${type.slug}/variants`,
    await readJson(`/v1/wheels/types/${type.slug}/variants`),
  );
  for (const model of models ?? []) {
    remember(
      `/v1/wheels/models/${type.slug}/${model.slug}`,
      await readJson(`/v1/wheels/models/${type.slug}/${model.slug}`),
    );
    remember(
      `/v1/wheels/models/${model.id}/variants`,
      await readJson(`/v1/wheels/models/${model.id}/variants`),
    );
  }
}

const categories = await readJson("/v1/shop/categories");
remember("/v1/shop/categories", categories);
for (const category of categories ?? []) {
  remember(
    `/v1/shop/categories/${category.slug}`,
    await readJson(`/v1/shop/categories/${category.slug}`),
  );
  remember(
    `/v1/shop/products?category=${encodeURIComponent(category.slug)}`,
    await readJson(`/v1/shop/products?category=${encodeURIComponent(category.slug)}`),
  );
}
const products = await readJson("/v1/shop/products");
remember("/v1/shop/products", products);
for (const product of products ?? []) {
  remember(
    `/v1/shop/products/${product.slug}`,
    await readJson(`/v1/shop/products/${product.slug}`),
  );
}

const articles = await readJson("/v1/articles");
remember("/v1/articles", articles);
for (const article of articles ?? []) {
  remember(`/v1/articles/${article.slug}`, await readJson(`/v1/articles/${article.slug}`));
}

remember("/v1/pages/home", await readJson("/v1/pages/home"));
for (const key of STUB_PAGES) {
  remember(`/v1/pages/${key}`, await readJson(`/v1/pages/${key}`));
}

fs.mkdirSync(mediaDir, { recursive: true });
fs.mkdirSync(snapshotDir, { recursive: true });
const localized = await rewrite(responses);
fs.writeFileSync(path.join(snapshotDir, "responses.json"), JSON.stringify(localized));
fs.writeFileSync(
  path.join(snapshotDir, "capture-report.json"),
  JSON.stringify(
    {
      routes: Object.keys(localized).length,
      files: urlToLocal.size,
      missing,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({ routes: Object.keys(localized).length, files: urlToLocal.size, missing: missing.length }),
);
