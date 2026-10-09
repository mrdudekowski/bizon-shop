import { spawn } from "node:child_process";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Small, non-production records keep dynamic static-export routes buildable in CI.
const TIRE_TYPE = {
  slug: "tbr",
  name: "CI fixture tire type",
  description: "",
  descriptionShort: "",
  sortOrder: 0,
  showInMenu: true,
  imageUrl: null,
  vehicleTypes: [],
  conditions: [],
};

const TIRE_MODEL = {
  id: "ci-tire-model-1",
  slug: "ci-fixture-tire",
  name: "CI fixture tire",
  tireTypeSlug: TIRE_TYPE.slug,
  tireTypeName: TIRE_TYPE.name,
  applicationTypes: ["regional"],
  brand: "BIZON",
  descriptionShort: "CI fixture",
  descriptionLong: "CI fixture",
  imageUrl: null,
  gallery: [],
  advantages: [],
  documents: [],
  selectionVehicleTypes: [],
  selectionConditions: [],
  selectionAxles: [],
  showInMenu: true,
  menuOrder: 0,
};

const TIRE_VARIANT = {
  id: "ci-tire-variant-1",
  size: "315/80R22.5",
  available: true,
  priceOnRequest: true,
};

const WHEEL_TYPE = {
  slug: "forged",
  name: "CI fixture forged wheels",
  description: "CI fixture",
  shortDescription: "CI fixture",
  sortOrder: 0,
  imageUrl: null,
};

const WHEEL_MODEL = {
  id: "ci-wheel-model-1",
  slug: "ci-fixture-wheel",
  name: "CI fixture wheel",
  wheelTypeSlug: WHEEL_TYPE.slug,
  wheelTypeName: WHEEL_TYPE.name,
  series: "CI",
  designStyle: "CI",
  material: "CI",
  constructionMethod: "CI",
  fitmentNotes: "CI fixture",
  descriptionShort: "CI fixture",
  descriptionLong: "CI fixture",
  imageUrl: null,
  gallery: [],
  showInMenu: true,
  menuOrder: 0,
};

const WHEEL_VARIANT = {
  id: "ci-wheel-variant-1",
  modelId: WHEEL_MODEL.id,
  sizeLabel: "CI fixture",
  available: true,
  priceOnRequest: true,
};

const SHOP_CATEGORY = {
  slug: "accessories",
  name: "CI fixture accessories",
  description: "CI fixture",
  imageUrl: null,
  showInMenu: true,
  sortOrder: 0,
  carousel: [],
};

const SHOP_PRODUCT = {
  id: "ci-shop-product-1",
  slug: "ci-fixture-product",
  name: "CI fixture product",
  categorySlug: SHOP_CATEGORY.slug,
  type: "CI",
  brand: "BIZON",
  descriptionShort: "CI fixture",
  descriptionLong: "CI fixture",
  imageUrl: null,
  gallery: [],
  priceOnRequest: true,
  available: true,
  variants: [{
    id: "ci-shop-variant-1",
    priceOnRequest: true,
    available: true,
    images: [],
  }],
};

const ARTICLE = {
  slug: "ci-fixture-article",
  title: "Build fixture article",
  excerpt: "Content used only to validate static route generation in CI.",
  publishedAt: "2026-01-01T00:00:00.000Z",
  content: "<p>CI build fixture</p>",
  imageUrl: null,
  showInMenu: false,
  menuOrder: 0,
};

const PAGE_KEYS = new Set([
  "home",
  "shop-home",
  "about",
  "contact",
  "warranty",
  "branding",
  "become-a-supplier",
  "privacy-policy",
  "shop-delivery-returns",
]);

const CONTENT_REVISION = {
  schema: 1,
  revision: `sha256:${"0".repeat(64)}`,
};

const json = (body, status = 200) => ({ status, body });

export function responseForBuildApiPath(pathname) {
  if (pathname === "/v1/content/revision") return json(CONTENT_REVISION);
  if (pathname === "/v1/tires/types") return json([TIRE_TYPE]);
  if (pathname === `/v1/tires/types/${TIRE_TYPE.slug}`) return json(TIRE_TYPE);
  if (pathname === `/v1/tires/types/${TIRE_TYPE.slug}/models`) return json([TIRE_MODEL]);
  if (pathname === `/v1/tires/models/${TIRE_TYPE.slug}/${TIRE_MODEL.slug}`) return json(TIRE_MODEL);
  if (pathname === `/v1/tires/models/${TIRE_MODEL.id}/variants`) return json([TIRE_VARIANT]);

  if (pathname === "/v1/wheels/types") return json([WHEEL_TYPE]);
  if (pathname === `/v1/wheels/types/${WHEEL_TYPE.slug}`) return json(WHEEL_TYPE);
  if (pathname === `/v1/wheels/types/${WHEEL_TYPE.slug}/models`) return json([WHEEL_MODEL]);
  if (pathname === `/v1/wheels/types/${WHEEL_TYPE.slug}/variants`) return json([WHEEL_VARIANT]);
  if (pathname === `/v1/wheels/models/${WHEEL_TYPE.slug}/${WHEEL_MODEL.slug}`) return json(WHEEL_MODEL);
  if (pathname === `/v1/wheels/models/${WHEEL_MODEL.id}/variants`) return json([WHEEL_VARIANT]);

  if (pathname === "/v1/shop/categories") return json([SHOP_CATEGORY]);
  if (pathname === `/v1/shop/categories/${SHOP_CATEGORY.slug}`) return json(SHOP_CATEGORY);
  if (pathname === "/v1/shop/products") return json([SHOP_PRODUCT]);
  if (pathname === `/v1/shop/products/${SHOP_PRODUCT.slug}`) return json(SHOP_PRODUCT);
  if (pathname === "/v1/articles") return json([ARTICLE]);
  if (pathname === `/v1/articles/${ARTICLE.slug}`) return json(ARTICLE);

  const pageMatch = /^\/v1\/pages\/([^/]+)$/.exec(pathname);
  if (pageMatch && PAGE_KEYS.has(decodeURIComponent(pageMatch[1]))) return json({ hero: {} });

  return json({ ok: false }, 404);
}

function startFixtureServer() {
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    const result = request.method === "GET"
      ? responseForBuildApiPath(pathname)
      : json({ ok: false }, 405);
    const body = JSON.stringify(result.body);
    response.writeHead(result.status, {
      "content-type": "application/json; charset=utf-8",
      "content-length": Buffer.byteLength(body),
    });
    response.end(body);
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Could not determine the CI API fixture address"));
        return;
      }
      resolve({ server, url: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function runBuildWithFixture() {
  const { server, url } = await startFixtureServer();
  const buildScript = path.resolve("scripts/buildWithContentRevision.js");
  const child = spawn(process.execPath, [buildScript], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      CONTENT_API_URL: url,
      NEXT_PUBLIC_API_URL: url,
    },
  });

  const exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`Next.js build stopped by ${signal}`));
      else resolve(code ?? 1);
    });
  }).finally(() => new Promise((resolve) => server.close(resolve)));

  process.exitCode = exitCode;
}

const isDirectExecution = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  runBuildWithFixture().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
