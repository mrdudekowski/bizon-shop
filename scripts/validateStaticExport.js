import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

function xmlText(value) {
  return value.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").trim();
}

function htmlAttribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}=["']([^"']+)["']`, "i").exec(tag)?.[1] ?? null;
}

async function requireFile(filePath, description) {
  try {
    await access(filePath);
  } catch {
    throw new Error(`Static export is missing ${description}: ${filePath}`);
  }
}

function resolveLocalFile(reference, baseUrl, siteOrigin, outDir) {
  let url;
  try {
    url = new URL(reference, baseUrl);
  } catch {
    throw new Error(`Static export contains an invalid asset URL: ${reference}`);
  }
  if (url.origin !== siteOrigin) return null;
  const pathname = decodeURIComponent(url.pathname);
  const filePath = path.resolve(outDir, `.${pathname}`);
  if (!filePath.startsWith(`${path.resolve(outDir)}${path.sep}`) && filePath !== path.resolve(outDir, "index.html")) {
    throw new Error(`Static export asset path escapes the output directory: ${pathname}`);
  }
  return filePath;
}

/** Check the SEO and local-file contract before a static release can be marked ready. */
export async function validateStaticExport({ outDir, siteUrl, revision }) {
  if (!outDir || !revision || !/^sha256:[a-f0-9]{64}$/.test(revision)) {
    throw new Error("Static export validation requires an output directory and published revision");
  }
  let parsedSiteUrl;
  try {
    parsedSiteUrl = new URL(siteUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid HTTPS origin");
  }
  if (parsedSiteUrl.protocol !== "https:" || parsedSiteUrl.username || parsedSiteUrl.password
    || parsedSiteUrl.pathname !== "/" || parsedSiteUrl.search || parsedSiteUrl.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTPS origin without credentials, path, query, or fragment");
  }
  const siteOrigin = parsedSiteUrl.origin;
  const sitemapPath = path.join(outDir, "sitemap.xml");
  const robotsPath = path.join(outDir, "robots.txt");
  const manifestPath = path.join(outDir, "media-manifest.json");
  const sitemap = await readFile(sitemapPath, "utf8");
  const robots = await readFile(robotsPath, "utf8");
  const mediaManifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (mediaManifest?.schema !== 1 || mediaManifest.revision !== revision || !Array.isArray(mediaManifest.files)) {
    throw new Error("Static media manifest does not match the published revision");
  }
  if (!/^User-Agent:\s*\*/im.test(robots) || !/^Allow:\s*\//im.test(robots)) {
    throw new Error("robots.txt must allow public-site crawling");
  }
  if (!robots.includes(`${siteOrigin}/sitemap.xml`)) {
    throw new Error("robots.txt must point to the configured sitemap URL");
  }

  const routeUrls = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map(([, value]) => xmlText(value));
  if (routeUrls.length === 0) throw new Error("Static sitemap contains no public routes");
  const uniqueRoutes = new Set();
  for (const routeUrl of routeUrls) {
    const parsedRoute = new URL(routeUrl);
    if (parsedRoute.origin !== siteOrigin || parsedRoute.protocol !== "https:" || parsedRoute.search || parsedRoute.hash) {
      throw new Error(`Sitemap route is not a clean URL on the configured site: ${routeUrl}`);
    }
    if (uniqueRoutes.has(parsedRoute.href)) throw new Error(`Sitemap contains a duplicate route: ${parsedRoute.href}`);
    uniqueRoutes.add(parsedRoute.href);

    const routeSegments = decodeURIComponent(parsedRoute.pathname).split("/").filter(Boolean);
    const htmlPath = path.join(outDir, ...routeSegments, "index.html");
    const rootHtmlPath = routeSegments.length === 0 ? path.join(outDir, "index.html") : htmlPath;
    await requireFile(rootHtmlPath, `sitemap page ${parsedRoute.pathname}`);
    const html = await readFile(rootHtmlPath, "utf8");
    if (!/<title>\s*[^<\s][\s\S]*?<\/title>/i.test(html)) {
      throw new Error(`Static page has no non-empty title: ${parsedRoute.pathname}`);
    }
    const canonicalTag = /<link\b[^>]*\brel=["']canonical["'][^>]*>/i.exec(html)?.[0];
    const canonicalHref = canonicalTag ? htmlAttribute(canonicalTag, "href") : null;
    if (!canonicalHref || new URL(canonicalHref, parsedSiteUrl).href !== parsedRoute.href) {
      throw new Error(`Static page canonical does not match its sitemap route: ${parsedRoute.pathname}`);
    }
    const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1];
    if (!h1 || h1.replace(/<[^>]+>/g, "").replace(/&nbsp;|&#160;/gi, " ").trim().length === 0) {
      throw new Error(`Static page has no rendered H1: ${parsedRoute.pathname}`);
    }

    const stylesheetTags = [...html.matchAll(/<link\b[^>]*>/gi)]
      .map(([tag]) => tag)
      .filter((tag) => /\brel=["']stylesheet["']/i.test(tag));
    for (const tag of stylesheetTags) {
      const href = htmlAttribute(tag, "href");
      const localPath = href ? resolveLocalFile(href, parsedRoute, siteOrigin, outDir) : null;
      if (localPath) {
        await requireFile(localPath, `stylesheet for ${parsedRoute.pathname}`);
        const stylesheet = await readFile(localPath, "utf8");
        const stylesheetUrl = new URL(href, parsedRoute);
        for (const [, rawUrl] of stylesheet.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
          const assetUrl = rawUrl.trim();
          if (!assetUrl || assetUrl.startsWith("data:") || assetUrl.startsWith("#")) continue;
          const assetPath = resolveLocalFile(assetUrl, stylesheetUrl, siteOrigin, outDir);
          if (assetPath) await requireFile(assetPath, `CSS asset for ${parsedRoute.pathname}`);
        }
      }
    }

    for (const [, tag] of html.matchAll(/<img\b[^>]*>/gi)) {
      const src = htmlAttribute(tag, "src");
      const localPath = src ? resolveLocalFile(src, parsedRoute, siteOrigin, outDir) : null;
      if (localPath) await requireFile(localPath, `image for ${parsedRoute.pathname}`);
    }
  }

  for (const item of mediaManifest.files) {
    if (typeof item?.path !== "string" || !/^\/snapshot-media\/[a-f0-9]{64}\.(jpg|png|webp|mp4|pdf)$/.test(item.path)) {
      throw new Error("Static media manifest contains an invalid local file path");
    }
    const mediaPath = path.resolve(outDir, `.${item.path}`);
    await requireFile(mediaPath, `media file ${item.path}`);
    const body = await readFile(mediaPath);
    const digest = createHash("sha256").update(body).digest("hex");
    if (body.length !== item.byteSize || digest !== item.sha256) {
      throw new Error(`Static media file does not match its size or SHA-256: ${item.path}`);
    }
  }

  return { routeCount: uniqueRoutes.size, mediaCount: mediaManifest.files.length };
}
