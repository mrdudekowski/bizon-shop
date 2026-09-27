import http from "node:http";
import pg from "pg";
import { dispatchAdminCall } from "./adminDispatch";
import {
  authenticate,
  bootstrapAccounts,
  clearedSessionCookie,
  endSession,
  ensureAuthSchema,
  readSession,
  readSessionCookie,
  sessionCookie,
  startSession,
  type AuthenticatedAccount,
} from "./admin/server/adminAuth";
import { deleteCartSession, readCartSession, saveCartSession } from "./cartSession";
import { insertRequest, type StoredRequestInput } from "./insertRequest";
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

function sendJson(
  res: http.ServerResponse,
  status: number,
  body: JsonBody,
  extraHeaders: Record<string, string> = {},
) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    ...extraHeaders,
  });
  res.end(payload);
}

function localOriginHeaders(origin: string | undefined): Record<string, string> {
  if (!origin || !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    // The CMS session lives in a cookie, so the browser only sends it when credentials are allowed.
    "access-control-allow-credentials": "true",
    vary: "origin",
  };
}

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function createPgDatabase(connectionString: string): ReadDatabase & {
  transaction<T>(run: (query: ReadDatabase["query"]) => Promise<T>): Promise<T>;
} {
  const pool = new pg.Pool({ connectionString });

  return {
    async query(sql, params) {
      const result = await pool.query(sql, params);
      return result.rows as Record<string, unknown>[];
    },
    async transaction(run) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await run(async (sql, params) => {
          const queryResult = await client.query(sql, params);
          return queryResult.rows as Record<string, unknown>[];
        });
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
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

function isAuthPath(path: string): boolean {
  return path === "/v1/admin/auth/login" || path === "/v1/admin/auth/logout" || path === "/v1/admin/auth/session";
}

function authQuery() {
  const database = getDatabase();
  return (sql: string, params: unknown[] = []) => database.query(sql, params);
}

function isSecureRequest(req: http.IncomingMessage): boolean {
  return req.headers["x-forwarded-proto"] === "https";
}

function sessionOf(account: AuthenticatedAccount): { login: string; role: AuthenticatedAccount["role"] } {
  return { login: account.login, role: account.role };
}

async function currentAccount(req: http.IncomingMessage): Promise<AuthenticatedAccount | null> {
  const token = readSessionCookie(req.headers.cookie);
  if (token == null) return null;
  return readSession(authQuery(), token);
}

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  const path = url.pathname;

  const originHeaders = localOriginHeaders(req.headers.origin);

  if (method === "OPTIONS" && (path === "/v1/admin" || path === "/v1/requests" || isAuthPath(path))) {
    res.writeHead(204, originHeaders);
    res.end();
    return;
  }

  if (method === "POST" && path === "/v1/admin/auth/login") {
    try {
      const body = (await readJson(req)) as { login?: unknown; password?: unknown };
      const login = typeof body.login === "string" ? body.login : "";
      const password = typeof body.password === "string" ? body.password : "";
      const account = await authenticate(authQuery(), login, password);
      if (account == null) {
        sendJson(res, 401, { ok: false, code: "invalid_credentials" }, originHeaders);
        return;
      }
      const token = await startSession(authQuery(), account.id);
      sendJson(res, 200, { ok: true, result: sessionOf(account) }, {
        ...originHeaders,
        "set-cookie": sessionCookie(token, isSecureRequest(req)),
      });
    } catch {
      sendJson(res, 500, { ok: false, code: "storage_unavailable" }, originHeaders);
    }
    return;
  }

  if (method === "POST" && path === "/v1/admin/auth/logout") {
    try {
      const token = readSessionCookie(req.headers.cookie);
      if (token != null) await endSession(authQuery(), token);
      sendJson(res, 200, { ok: true, result: null }, {
        ...originHeaders,
        "set-cookie": clearedSessionCookie(isSecureRequest(req)),
      });
    } catch {
      sendJson(res, 500, { ok: false, code: "storage_unavailable" }, originHeaders);
    }
    return;
  }

  if (method === "GET" && path === "/v1/admin/auth/session") {
    try {
      const account = await currentAccount(req);
      if (account == null) {
        sendJson(res, 401, { ok: false, code: "unauthorized" }, originHeaders);
        return;
      }
      sendJson(res, 200, { ok: true, result: sessionOf(account) }, originHeaders);
    } catch {
      sendJson(res, 500, { ok: false, code: "storage_unavailable" }, originHeaders);
    }
    return;
  }

  if (method === "POST" && path === "/v1/admin") {
    try {
      const account = await currentAccount(req);
      if (account == null) {
        sendJson(res, 401, { ok: false, code: "unauthorized" }, originHeaders);
        return;
      }
      const body = (await readJson(req)) as { method?: string; args?: unknown[] };
      const outcome = await dispatchAdminCall(body, account);
      sendJson(res, outcome.status, outcome.body, originHeaders);
    } catch {
      sendJson(res, 400, { ok: false, code: "publish_blocked" }, originHeaders);
    }
    return;
  }

  if (path === "/v1/cart") {
    const token = req.headers["x-cart-token"];
    const cartToken = typeof token === "string" ? token : "";
    if (!cartToken) {
      sendJson(res, 400, { ok: false });
      return;
    }
    try {
      const database = getDatabase();
      if (method === "GET") {
        const items = await readCartSession(database, cartToken);
        sendJson(res, 200, { ok: true, hasSession: items != null, items: items ?? [] });
        return;
      }
      if (method === "PUT") {
        const body = (await readJson(req)) as { items?: unknown };
        await saveCartSession(database, cartToken, body.items);
        sendJson(res, 200, { ok: true });
        return;
      }
      if (method === "DELETE") {
        await deleteCartSession(database, cartToken);
        sendJson(res, 200, { ok: true });
        return;
      }
    } catch {
      sendJson(res, 500, { ok: false });
      return;
    }
  }

  if (method === "POST" && path === "/v1/requests") {
    try {
      const body = (await readJson(req)) as StoredRequestInput;
      if (!body || typeof body.name !== "string" || body.name.trim() === "") {
        sendJson(res, 400, { ok: false });
        return;
      }
      const database = getDatabase() as ReadDatabase & {
        transaction<T>(run: (query: ReadDatabase["query"]) => Promise<T>): Promise<T>;
      };
      const requestId = await database.transaction((query) =>
        insertRequest({ query }, body),
      );
      sendJson(res, 201, { ok: true, requestId });
    } catch {
      sendJson(res, 500, { ok: false });
    }
    return;
  }

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

async function prepareAuth(): Promise<void> {
  await ensureAuthSchema(authQuery());
  await bootstrapAccounts(authQuery(), process.env);
}

server.listen(PORT, HOST, () => {
  console.log(`backend-app listening on http://${HOST}:${PORT}`);
  prepareAuth().then(
    () => console.log("CMS accounts ready"),
    (error: unknown) => console.error("CMS accounts unavailable:", (error as Error).message),
  );
});
