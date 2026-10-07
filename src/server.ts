import http from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { dispatchAdminCall } from "./adminDispatch";
import { isAdminRequestOriginAllowed, localOriginHeaders } from "./adminCors";
import {
  authenticate,
  bootstrapAccounts,
  clearedSessionCookie,
  endSession,
  readSession,
  readSessionCookie,
  sessionCookie,
  startSession,
  type AuthenticatedAccount,
} from "./admin/server/adminAuth";
import { assertSchemaReady } from "./schemaReadiness";
import { checkBackendReadiness } from "./readiness";
import { createContentRevision, createRequestLogRecord } from "./requestTelemetry";
import { deleteCartSession, readCartSession, saveCartSession } from "./cartSession";
import { insertRequest, type StoredRequestInput } from "./insertRequest";
import { AdminClientError } from "./admin/client/errors";
import { LoginThrottle, type LoginAttemptTicket } from "./admin/server/loginThrottle";
import { createPostgresAdminClient } from "./admin/server/postgresAdmin";
import { readJsonRequestBody, readRequestBody, RequestBodyTooLarge } from "./readRequestBody";
import { MediaRejected, MAX_MEDIA_BYTES } from "./storage/putMedia";
import { normalizeRequest } from "./requests/normalizeRequest";
import { parseRequestBody, validateRequest } from "./requests/validateRequest";
import { checkRateLimit, trustedClientAddress } from "./security/rateLimit";
import { isSiteAffectingPublicationMethod, triggerStaticSiteDeploy } from "./deploy/timewebApps";
import {
  readArticleBySlug,
  readArticles,
  readHomePatch,
  readShopHomePatch,
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

/** Only used to turn a request path into a URL; the request never leaves this process. */
const URL_BASE = "http://localhost";
const PORT = Number.parseInt(process.env.PORT ?? "4000", 10);
const CART_SESSION_COOKIE = "bizon-cart-session-v1";
const CART_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const loginThrottle = new LoginThrottle();

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

function sendPublishedJson(res: http.ServerResponse, status: number, body: JsonBody) {
  const revision = createContentRevision(JSON.stringify(body));
  sendJson(res, status, body, {
    "cache-control": "no-store",
    "x-content-revision": revision,
  });
}

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  return readJsonRequestBody(req);
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
  const protocol = req.headers["x-forwarded-proto"];
  return process.env.NODE_ENV === "production" || String(protocol ?? "").split(",")[0]?.trim() === "https";
}

function readCartCookie(header: string | undefined): string | null {
  for (const part of (header ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== CART_SESSION_COOKIE) continue;
    try {
      const token = decodeURIComponent(part.slice(separator + 1).trim());
      return token || null;
    } catch {
      return null;
    }
  }
  return null;
}

function cartCookie(token: string | null, secure: boolean): string {
  const attributes = [
    `${CART_SESSION_COOKIE}=${token ?? ""}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${token ? CART_SESSION_TTL_SECONDS : 0}`,
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

function sessionOf(account: AuthenticatedAccount) {
  return { login: account.login, role: account.role, capabilities: account.capabilities };
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
  const url = new URL(req.url ?? "/", URL_BASE);
  const path = url.pathname;

  const originHeaders = localOriginHeaders(req.headers.origin);
  for (const [name, value] of Object.entries(originHeaders)) res.setHeader(name, value);

  if (!isAdminRequestOriginAllowed(path, method, req.headers.origin)) {
    sendJson(res, 403, { ok: false, code: "origin_not_allowed" });
    return;
  }

  if (path === "/health" && method === "GET") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (path === "/ready" && method === "GET") {
    try {
      await checkBackendReadiness((sql) => getDatabase().query(sql));
      sendJson(res, 200, { ok: true });
    } catch {
      sendJson(res, 503, { ok: false });
    }
    return;
  }

  if (method === "OPTIONS") {
    res.writeHead(204, originHeaders);
    res.end();
    return;
  }

  if (method === "POST" && path === "/v1/admin/auth/login") {
    let attemptTicket: LoginAttemptTicket | null = null;
    try {
      const body = (await readJson(req)) as { login?: unknown; password?: unknown };
      const login = typeof body.login === "string" ? body.login : "";
      const password = typeof body.password === "string" ? body.password : "";
      const reservation = loginThrottle.begin(login);
      if (!reservation.allowed) {
        sendJson(res, 429, { ok: false, code: "login_throttled" }, {
          ...originHeaders,
          "retry-after": String(reservation.retryAfterSeconds),
        });
        return;
      }
      attemptTicket = reservation.ticket;
      const account = await authenticate(authQuery(), login, password);
      if (account == null) {
        loginThrottle.finish(attemptTicket, "failed");
        attemptTicket = null;
        sendJson(res, 401, { ok: false, code: "invalid_credentials" }, originHeaders);
        return;
      }
      const token = await startSession(authQuery(), account.id);
      loginThrottle.finish(attemptTicket, "succeeded");
      attemptTicket = null;
      sendJson(res, 200, { ok: true, result: sessionOf(account) }, {
        ...originHeaders,
        "set-cookie": sessionCookie(token, isSecureRequest(req)),
      });
    } catch (error) {
      if (attemptTicket) loginThrottle.finish(attemptTicket, "aborted");
      if (error instanceof RequestBodyTooLarge) {
        sendJson(res, 413, { ok: false, code: "request_too_large" }, originHeaders);
        return;
      }
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

  const replacementMatch = /^\/v1\/admin\/assets\/(\d+)$/.exec(path);
  const cancelReplacementMatch = /^\/v1\/admin\/assets\/(\d+)\/replacement$/.exec(path);
  if (
    (method === "POST" && path === "/v1/admin/assets") ||
    (method === "PUT" && replacementMatch) ||
    (method === "DELETE" && cancelReplacementMatch)
  ) {
    try {
      const account = await currentAccount(req);
      if (account == null) {
        sendJson(res, 401, { ok: false, code: "unauthorized" }, originHeaders);
        return;
      }
      const client = createPostgresAdminClient(account);
      if (cancelReplacementMatch) {
        await client.cancelAssetReplacement(cancelReplacementMatch[1]);
        sendJson(res, 200, { ok: true, result: null }, originHeaders);
        return;
      }
      const name = url.searchParams.get("name") ?? "upload";
      const mimeType = url.searchParams.get("type") || String(req.headers["content-type"] ?? "");
      const body = await readRequestBody(req, MAX_MEDIA_BYTES);
      const result = replacementMatch
        ? await client.replaceAsset(replacementMatch[1], { name, mimeType, body })
        : await client.createAsset({ name, mimeType, body });
      sendJson(res, 200, { ok: true, result }, originHeaders);
    } catch (error) {
      const code =
        error instanceof AdminClientError
          ? error.code
          : error instanceof MediaRejected
            ? error.code
            : "publish_blocked";
      sendJson(res, 400, { ok: false, code }, originHeaders);
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
      if (outcome.body.ok && isSiteAffectingPublicationMethod(body.method)) {
        const deploy = await triggerStaticSiteDeploy();
        res.setHeader("x-bizon-site-deploy", deploy.status);
      }
      sendJson(res, outcome.status, outcome.body, originHeaders);
    } catch (error) {
      if (error instanceof RequestBodyTooLarge) {
        sendJson(res, 413, { ok: false, code: "request_too_large" }, originHeaders);
        return;
      }
      sendJson(res, 400, { ok: false, code: "publish_blocked" }, originHeaders);
    }
    return;
  }

  if (method === "POST" && path === "/v1/admin/site-deploy/retry") {
    try {
      const account = await currentAccount(req);
      if (account == null) {
        sendJson(res, 401, { ok: false, code: "unauthorized" });
        return;
      }
      if (account.role !== "admin") {
        sendJson(res, 403, { ok: false, code: "forbidden" });
        return;
      }
      const deploy = await triggerStaticSiteDeploy();
      res.setHeader("x-bizon-site-deploy", deploy.status);
      if (deploy.status === "started") {
        sendJson(res, 200, { ok: true, result: deploy });
      } else {
        sendJson(res, deploy.status === "failed" ? 502 : 503, {
          ok: false,
          code: deploy.status === "failed" ? "site_deploy_failed" : "site_deploy_not_configured",
        });
      }
    } catch {
      sendJson(res, 500, { ok: false, code: "site_deploy_failed" });
    }
    return;
  }

  if (path === "/v1/cart") {
    let cartToken = readCartCookie(req.headers.cookie);
    if (method === "GET" && !cartToken) {
      sendJson(res, 200, { ok: true, hasSession: false, items: [] });
      return;
    }
    if (method === "PUT" && !cartToken) cartToken = randomBytes(32).toString("base64url");
    try {
      const database = getDatabase();
      if (method === "GET") {
        const items = await readCartSession(database, cartToken!);
        sendJson(res, 200, { ok: true, hasSession: items != null, items: items ?? [] });
        return;
      }
      if (method === "PUT") {
        const body = (await readJson(req)) as { items?: unknown };
        await saveCartSession(database, cartToken!, body.items);
        sendJson(res, 200, { ok: true }, { "set-cookie": cartCookie(cartToken, isSecureRequest(req)) });
        return;
      }
      if (method === "DELETE") {
        if (cartToken) await deleteCartSession(database, cartToken);
        sendJson(res, 200, { ok: true }, { "set-cookie": cartCookie(null, isSecureRequest(req)) });
        return;
      }
    } catch (error) {
      sendJson(res, error instanceof RequestBodyTooLarge ? 413 : 500, {
        ok: false,
        ...(error instanceof RequestBodyTooLarge ? { code: "request_too_large" } : {}),
      });
      return;
    }
  }

  if (method === "POST" && path === "/v1/requests") {
    try {
      const rateLimit = checkRateLimit(`requests:${trustedClientAddress(req.socket.remoteAddress, req.headers["x-forwarded-for"]?.toString())}`);
      if (!rateLimit.allowed) {
        sendJson(res, 429, { ok: false, error: "rate_limit_exceeded", message: "Too many requests. Please try again later." }, {
          "retry-after": String(rateLimit.retryAfterSeconds),
        });
        return;
      }
      let rawBody: unknown;
      try {
        rawBody = await readJson(req);
      } catch (error) {
        if (error instanceof RequestBodyTooLarge) throw error;
        sendJson(res, 400, {
          ok: false,
          error: "invalid_request_body",
          message: "Invalid request body",
        });
        return;
      }
      const parsed = parseRequestBody(rawBody);
      if (!parsed.ok) {
        sendJson(res, 400, { ok: false, error: parsed.error, message: parsed.message });
        return;
      }
      const validated = validateRequest(parsed.body);
      if (!validated.ok) {
        sendJson(res, 400, { ok: false, error: validated.error, message: validated.message });
        return;
      }
      const forwardedFor = req.headers["x-forwarded-for"]?.toString();
      const trustedAddress = trustedClientAddress(req.socket.remoteAddress, forwardedFor);
      const body = normalizeRequest(validated.body, {
        sourceIp: trustedAddress,
        userAgent: req.headers["user-agent"],
      }) as StoredRequestInput;
      const database = getDatabase() as ReadDatabase & {
        transaction<T>(run: (query: ReadDatabase["query"]) => Promise<T>): Promise<T>;
      };
      const requestId = await database.transaction((query) =>
        insertRequest({ query }, body),
      );
      sendJson(res, 201, { ok: true, requestId, message: "Заявка принята" });
    } catch (error) {
      sendJson(res, error instanceof RequestBodyTooLarge ? 413 : 502, {
        ok: false,
        ...(error instanceof RequestBodyTooLarge
          ? { error: "request_too_large", message: "Request is too large" }
          : { error: "request_create_failed", message: "Could not save the request" }),
      });
    }
    return;
  }

  if (method !== "GET") {
    sendJson(res, 404, { ok: false });
    return;
  }

  try {
    const database = getDatabase();

    if (path === "/v1/tires/types") {
      sendPublishedJson(res, 200, await readTireTypes(database));
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
        sendPublishedJson(res, 200, tireType);
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
        sendPublishedJson(res, 200, await readTireModelsByType(database, typeSlug));
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
          sendPublishedJson(res, 200, model);
          return;
        }
      }
    }

    {
      const match = path.match(/^\/v1\/tires\/models\/([^/]+)\/variants$/);
      if (match) {
        const modelId = decodeURIComponent(match[1]);
        sendPublishedJson(res, 200, await readTireVariants(database, modelId));
        return;
      }
    }

    if (path === "/v1/pages/home") {
      const home = await readHomePatch(database);
      if (!home) {
        sendJson(res, 404, { ok: false });
        return;
      }
      sendPublishedJson(res, 200, home);
      return;
    }

    if (path === "/v1/pages/shop-home") {
      const shopHome = await readShopHomePatch(database);
      if (!shopHome) {
        sendJson(res, 404, { ok: false });
        return;
      }
      sendPublishedJson(res, 200, shopHome);
      return;
    }

    {
      const match = path.match(/^\/v1\/pages\/([^/]+)$/);
      if (match && match[1] !== "home" && match[1] !== "shop-home") {
        const page = await readStubPatch(database, decodeURIComponent(match[1]));
        if (!page) {
          sendJson(res, 404, { ok: false });
          return;
        }
        sendPublishedJson(res, 200, page);
        return;
      }
    }

    if (path === "/v1/articles") {
      sendPublishedJson(res, 200, await readArticles(database));
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
        sendPublishedJson(res, 200, article);
        return;
      }
    }

    if (path === "/v1/wheels/types") {
      sendPublishedJson(res, 200, await readWheelTypes(database));
      return;
    }

    {
      const modelsMatch = path.match(/^\/v1\/wheels\/types\/([^/]+)\/models$/);
      if (modelsMatch) {
        sendPublishedJson(res, 200, await readWheelModelsByType(database, decodeURIComponent(modelsMatch[1])));
        return;
      }
      const variantsMatch = path.match(/^\/v1\/wheels\/types\/([^/]+)\/variants$/);
      if (variantsMatch) {
        sendPublishedJson(
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
        sendPublishedJson(res, 200, wheelType);
        return;
      }
    }

    {
      const match = path.match(/^\/v1\/wheels\/models\/([^/]+)\/variants$/);
      if (match) {
        sendPublishedJson(res, 200, await readWheelVariants(database, decodeURIComponent(match[1])));
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
        sendPublishedJson(res, 200, model);
        return;
      }
    }

    if (path === "/v1/shop/categories") {
      sendPublishedJson(res, 200, await readShopCategories(database));
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
        sendPublishedJson(res, 200, category);
        return;
      }
    }

    if (path === "/v1/shop/products") {
      const category = url.searchParams.get("category")?.trim();
      sendPublishedJson(res, 200, await readShopProducts(database, category || undefined));
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
        sendPublishedJson(res, 200, product);
        return;
      }
    }

    sendJson(res, 404, { ok: false });
  } catch {
    sendJson(res, 500, { ok: false });
  }
}

const LISTEN_HOSTS = process.env.NODE_ENV === "production" ? ["0.0.0.0"] : ["127.0.0.1", "::1"];

const servers = LISTEN_HOSTS.map(() =>
  http.createServer((req, res) => {
    const requestId = randomUUID();
    const startedAt = performance.now();
    res.setHeader("x-request-id", requestId);
    res.once("finish", () => {
      console.info(JSON.stringify(createRequestLogRecord({
        method: req.method,
        url: req.url ?? "/",
        statusCode: res.statusCode,
        durationMs: performance.now() - startedAt,
        requestId,
        contentRevision: res.getHeader("x-content-revision")?.toString() ?? null,
      })));
    });
    void handleRequest(req, res);
  }),
);

async function prepareAuth(): Promise<void> {
  await assertSchemaReady(authQuery());
  await bootstrapAccounts(authQuery(), process.env);
}

prepareAuth().then(
  () => {
    console.log("CMS accounts ready");
    servers.forEach((server, index) => {
      const host = LISTEN_HOSTS[index];
      server.on("error", (error: NodeJS.ErrnoException) => {
        console.error(`backend-app cannot listen on ${host}:${PORT}:`, error.message);
      });
      server.listen(PORT, host, () => {
        console.log(`backend-app listening on ${host}:${PORT}`);
      });
    });
  },
  (error: unknown) => {
    console.error("Backend schema is not ready; backend was not started:", (error as Error).message);
    process.exitCode = 1;
  });
