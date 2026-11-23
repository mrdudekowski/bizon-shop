import { createReadStream } from "node:fs";
import { access, realpath, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../out");
const CONTENT_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

async function resolveExportFile(root, pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return { error: 400 };
  }

  if (decodedPath.includes("\\") || decodedPath.includes("\0")) return { error: 400 };

  const relativePath = decodedPath.replace(/^\/+/, "");
  const candidate = path.resolve(root, relativePath);
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) return { error: 404 };

  const candidates = [candidate];
  if (decodedPath.endsWith("/")) candidates.unshift(path.join(candidate, "index.html"));
  else if (!path.extname(candidate)) candidates.unshift(path.join(candidate, "index.html"));

  for (const filePath of candidates) {
    try {
      const info = await stat(filePath);
      if (!info.isFile()) continue;
      const resolvedPath = await realpath(filePath);
      if (resolvedPath !== root && !resolvedPath.startsWith(`${root}${path.sep}`)) return { error: 404 };
      return { filePath: resolvedPath, size: info.size };
    } catch {
      // Try the next static-export candidate, then return the generated 404 page.
    }
  }

  return { error: 404 };
}

export function createStaticExportServer({ directory = DEFAULT_ROOT } = {}) {
  const root = path.resolve(directory);

  return createServer(async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
      response.end("Method Not Allowed");
      return;
    }

    let pathname;
    try {
      pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    } catch {
      response.writeHead(400).end();
      return;
    }

    const result = await resolveExportFile(root, pathname);
    if (result.filePath) {
      response.writeHead(200, {
        "Cache-Control": "no-cache",
        "Content-Length": result.size,
        "Content-Type": CONTENT_TYPES.get(path.extname(result.filePath).toLowerCase()) ?? "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      });
      if (request.method === "HEAD") response.end();
      else createReadStream(result.filePath).pipe(response);
      return;
    }

    if (result.error === 400) {
      response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" }).end("Bad Request");
      return;
    }

    const notFound = await resolveExportFile(root, "/404.html");
    response.writeHead(404, {
      "Cache-Control": "no-cache",
      ...(notFound.filePath ? {
        "Content-Length": notFound.size,
        "Content-Type": "text/html; charset=utf-8",
      } : { "Content-Type": "text/plain; charset=utf-8" }),
      "X-Content-Type-Options": "nosniff",
    });
    if (request.method === "HEAD") response.end();
    else if (notFound.filePath) createReadStream(notFound.filePath).pipe(response);
    else response.end("Not Found");
  });
}

const isDirectRun = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isDirectRun) {
  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535; received ${process.env.PORT}`);
  }

  const indexFile = path.join(DEFAULT_ROOT, "index.html");
  await access(indexFile).catch(() => {
    throw new Error(`Static CMS export is missing at ${indexFile}; run npm run build before npm start.`);
  });

  const root = await realpath(DEFAULT_ROOT);
  const server = createStaticExportServer({ directory: root });
  server.listen(port, "0.0.0.0", () => {
    console.log(`BIZON CMS static export listening on 0.0.0.0:${port}`);
  });
}
