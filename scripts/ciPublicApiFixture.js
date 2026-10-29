import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Small, non-production published records for runtime and browser checks in CI.
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
  selectionAxles: ["drive"],
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
  series: "Satin Black",
  designStyle: "Off-road",
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

const WHEEL_MODEL_2 = {
  ...WHEEL_MODEL,
  id: "ci-wheel-model-2",
  slug: "ci-fixture-wheel-2",
  name: "CI fixture wheel 2",
  series: "Bronze",
  designStyle: "Street",
};

const WHEEL_VARIANT = {
  id: "ci-wheel-variant-1",
  modelId: WHEEL_MODEL.id,
  sizeLabel: "CI fixture",
  diameter: 18,
  width: 9,
  pcd: "6×139.7",
  offsetET: 0,
  centerBore: 106.1,
  color: "Satin Black",
  available: true,
  priceOnRequest: true,
};

const WHEEL_VARIANT_2 = {
  ...WHEEL_VARIANT,
  id: "ci-wheel-variant-2",
  modelId: WHEEL_MODEL_2.id,
  diameter: 17,
  width: 8,
  pcd: "5×127",
  centerBore: 71.5,
  color: "Bronze",
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

// The optional branding page is intentionally absent to exercise the 404 build path.
const PAGE_KEYS = new Set([
  "home",
  "shop-home",
  "about",
  "contact",
  "warranty",
  "become-a-supplier",
  "delivery-geography",
  "privacy-policy",
  "shop-delivery-returns",
]);
const MISSING_OPTIONAL_PAGE_KEYS = new Set(["branding"]);

function pageFixture(key) {
  return key === "home" || key === "shop-home"
    ? { hero: {} }
    : { hero: { title: `CI fixture ${key}` } };
}

const json = (body, status = 200) => ({ status, body });

export function responseForPublicApiPath(pathname) {
  if (pathname === "/v1/tires/types") return json([TIRE_TYPE]);
  if (pathname === `/v1/tires/types/${TIRE_TYPE.slug}`) return json(TIRE_TYPE);
  if (pathname === `/v1/tires/types/${TIRE_TYPE.slug}/models`) return json([TIRE_MODEL]);
  if (pathname === `/v1/tires/models/${TIRE_TYPE.slug}/${TIRE_MODEL.slug}`) return json(TIRE_MODEL);
  if (pathname === `/v1/tires/models/${TIRE_MODEL.id}/variants`) return json([TIRE_VARIANT]);

  if (pathname === "/v1/wheels/types") return json([WHEEL_TYPE]);
  if (pathname === `/v1/wheels/types/${WHEEL_TYPE.slug}`) return json(WHEEL_TYPE);
  if (pathname === `/v1/wheels/types/${WHEEL_TYPE.slug}/models`) return json([WHEEL_MODEL, WHEEL_MODEL_2]);
  if (pathname === `/v1/wheels/types/${WHEEL_TYPE.slug}/variants`) return json([WHEEL_VARIANT, WHEEL_VARIANT_2]);
  if (pathname === `/v1/wheels/models/${WHEEL_TYPE.slug}/${WHEEL_MODEL.slug}`) return json(WHEEL_MODEL);
  if (pathname === `/v1/wheels/models/${WHEEL_TYPE.slug}/${WHEEL_MODEL_2.slug}`) return json(WHEEL_MODEL_2);
  if (pathname === `/v1/wheels/models/${WHEEL_MODEL.id}/variants`) return json([WHEEL_VARIANT]);
  if (pathname === `/v1/wheels/models/${WHEEL_MODEL_2.id}/variants`) return json([WHEEL_VARIANT_2]);

  if (pathname === "/v1/shop/categories") return json([SHOP_CATEGORY]);
  if (pathname === `/v1/shop/categories/${SHOP_CATEGORY.slug}`) return json(SHOP_CATEGORY);
  if (pathname === "/v1/shop/products") return json([SHOP_PRODUCT]);
  if (pathname === `/v1/shop/products/${SHOP_PRODUCT.slug}`) return json(SHOP_PRODUCT);
  if (pathname === "/v1/articles") return json([ARTICLE]);
  if (pathname === `/v1/articles/${ARTICLE.slug}`) return json(ARTICLE);

  const pageMatch = /^\/v1\/pages\/([^/]+)$/.exec(pathname);
  if (pageMatch && PAGE_KEYS.has(decodeURIComponent(pageMatch[1]))) {
    const key = decodeURIComponent(pageMatch[1]);
    return json(pageFixture(key));
  }
  if (pageMatch && MISSING_OPTIONAL_PAGE_KEYS.has(decodeURIComponent(pageMatch[1]))) {
    return json({ ok: false, code: "not_found" }, 404);
  }

  return json({ ok: false }, 404);
}

function startFixtureServer(port = 0) {
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    const result = request.method === "GET"
      ? responseForPublicApiPath(pathname)
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
    server.listen(port, "127.0.0.1", () => {
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

async function serveFixtureApi() {
  const port = Number(process.env.CI_CONTENT_API_PORT ?? 4311);
  const { server, url } = await startFixtureServer(port);
  console.log(`CI published API fixture listening at ${url}`);
  await new Promise((resolve) => {
    const stop = () => server.close(resolve);
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  });
}

const isDirectExecution = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  serveFixtureApi().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
