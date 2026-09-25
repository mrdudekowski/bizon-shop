import http from "node:http";
import pg from "pg";
import {
  readArticleBySlug,
  readArticles,
  readHomePatch,
  readShopProductBySlug,
  readShopProducts,
  readShopCategories,
  readStubPatch,
  readTireModel,
  readTireModelsByType,
  readTireTypes,
  readTireVariants,
  readWheelModel,
  readWheelModelsByType,
  readWheelTypes,
  readWheelVariants,
  readWheelVariantsByType,
  type ReadDatabase,
} from "./publishedRead";

const HOST = "127.0.0.1";
const PORT = 4000;

type JsonBody = unknown;

function sendJson(res: http.ServerResponse, status: number, body: JsonBody) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function createPgDatabase(connectionString: string): ReadDatabase {
  const pool = new pg.Pool({ connectionString });

  return {
    async query(sql, params) {
      const result = await pool.query(sql, params);
      return result.rows as Record<string, unknown>[];
    },
  };
}

function requireDatabase(): ReadDatabase {
  const connectionString = process.env.DATABASE_URI;
  if (!connectionString) {
    throw new Error("DATABASE_URI is required for data routes");
  }
  return createPgDatabase(connectionString);
}

let db: ReadDatabase | null = null;

function getDatabase(): ReadDatabase {
  if (!db) {
    db = requireDatabase();
  }
  return db;
}

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  const path = url.pathname;

  if (method !== "GET") {
    sendJson(res, 404, { ok: false });
    return;
  }

  if (path === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  try {
    const database = getDatabase();

    if (path === "/v1/tires/types") {
      sendJson(res, 200, await readTireTypes(database));
      return;
    }

    {
      const match = path.match(/^\/v1\/tires\/types\/([^/]+)$/);
      if (match) {
        const slug = decodeURIComponent(match[1]);
        const types = await readTireTypes(database);
        const tireType = types.find((entry) => entry.slug === slug);
        if (!tireType) {
          sendJson(res, 404, { ok: false });
          return;
        }
        sendJson(res, 200, tireType);
        return;
      }
    }

    {
      const match = path.match(/^\/v1\/tires\/types\/([^/]+)\/models$/);
      if (match) {
        const typeSlug = decodeURIComponent(match[1]);
        const types = await readTireTypes(database);
        const tireType = types.find((entry) => entry.slug === typeSlug);
        if (!tireType) {
          sendJson(res, 404, { ok: false });
          return;
        }
        sendJson(res, 200, await readTireModelsByType(database, typeSlug));
        return;
      }
    }

    {
      const match = path.match(/^\/v1\/tires\/models\/([^/]+)\/([^/]+)$/);
      if (match) {
        const typeSlug = decodeURIComponent(match[1]);
        const modelSlug = decodeURIComponent(match[2]);
        // Prefer slug path over numeric id/variants when the second segment is not "variants"
        if (modelSlug !== "variants") {
          const model = await readTireModel(database, typeSlug, modelSlug);
          if (!model) {
            sendJson(res, 404, { ok: false });
            return;
          }
          sendJson(res, 200, model);
          return;
        }
      }
    }

    {
      const match = path.match(/^\/v1\/tires\/models\/([^/]+)\/variants$/);
      if (match) {
        const modelId = decodeURIComponent(match[1]);
        sendJson(res, 200, await readTireVariants(database, modelId));
        return;
      }
    }

    if (path === "/v1/pages/home") {
      const home = await readHomePatch(database);
      if (!home) {
        sendJson(res, 404, { ok: false });
        return;
      }
      sendJson(res, 200, home);
      return;
    }

    {
      const match = path.match(/^\/v1\/pages\/([^/]+)$/);
      if (match && match[1] !== "home") {
        const page = await readStubPatch(database, decodeURIComponent(match[1]));
        if (!page) {
          sendJson(res, 404, { ok: false });
          return;
        }
        sendJson(res, 200, page);
        return;
      }
    }

    if (path === "/v1/articles") {
      sendJson(res, 200, await readArticles(database));
      return;
    }

    {
      const match = path.match(/^\/v1\/articles\/([^/]+)$/);
      if (match) {
        const slug = decodeURIComponent(match[1]);
        const article = await readArticleBySlug(database, slug);
        if (!article) {
          sendJson(res, 404, { ok: false });
          return;
        }
        sendJson(res, 200, article);
        return;
      }
    }

    if (path === "/v1/wheels/types") {
      sendJson(res, 200, await readWheelTypes(database));
      return;
    }

    {
      const modelsMatch = path.match(/^\/v1\/wheels\/types\/([^/]+)\/models$/);
      if (modelsMatch) {
        sendJson(res, 200, await readWheelModelsByType(database, decodeURIComponent(modelsMatch[1])));
        return;
      }
      const variantsMatch = path.match(/^\/v1\/wheels\/types\/([^/]+)\/variants$/);
      if (variantsMatch) {
        sendJson(
          res,
          200,
          await readWheelVariantsByType(database, decodeURIComponent(variantsMatch[1])),
        );
        return;
      }
      const typeMatch = path.match(/^\/v1\/wheels\/types\/([^/]+)$/);
      if (typeMatch) {
        const slug = decodeURIComponent(typeMatch[1]);
        const types = await readWheelTypes(database);
        const wheelType = types.find((entry) => entry.slug === slug);
        if (!wheelType) {
          sendJson(res, 404, { ok: false });
          return;
        }
        sendJson(res, 200, wheelType);
        return;
      }
    }

    {
      const match = path.match(/^\/v1\/wheels\/models\/([^/]+)\/variants$/);
      if (match) {
        sendJson(res, 200, await readWheelVariants(database, decodeURIComponent(match[1])));
        return;
      }
    }

    {
      const match = path.match(/^\/v1\/wheels\/models\/([^/]+)\/([^/]+)$/);
      if (match) {
        const model = await readWheelModel(
          database,
          decodeURIComponent(match[1]),
          decodeURIComponent(match[2]),
        );
        if (!model) {
          sendJson(res, 404, { ok: false });
          return;
        }
        sendJson(res, 200, model);
        return;
      }
    }

    if (path === "/v1/shop/categories") {
      sendJson(res, 200, await readShopCategories(database));
      return;
    }

    {
      const match = path.match(/^\/v1\/shop\/categories\/([^/]+)$/);
      if (match) {
        const slug = decodeURIComponent(match[1]);
        const categories = await readShopCategories(database);
        const category = categories.find((entry) => entry.slug === slug);
        if (!category) {
          sendJson(res, 404, { ok: false });
          return;
        }
        sendJson(res, 200, category);
        return;
      }
    }

    if (path === "/v1/shop/products") {
      const category = url.searchParams.get("category")?.trim();
      sendJson(res, 200, await readShopProducts(database, category || undefined));
      return;
    }

    {
      const match = path.match(/^\/v1\/shop\/products\/([^/]+)$/);
      if (match) {
        const product = await readShopProductBySlug(database, decodeURIComponent(match[1]));
        if (!product) {
          sendJson(res, 404, { ok: false });
          return;
        }
        sendJson(res, 200, product);
        return;
      }
    }

    sendJson(res, 404, { ok: false });
  } catch {
    sendJson(res, 500, { ok: false });
  }
}

const server = http.createServer((req, res) => {
  void handleRequest(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`backend-app listening on http://${HOST}:${PORT}`);
});
