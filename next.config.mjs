import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildImageRemotePatterns } from "./src/lib/images/remotePatterns.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const imageRemotePatterns = buildImageRemotePatterns();

if (process.env.NODE_ENV === "production") {
  for (const key of ["CONTENT_API_URL", "NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_SITE_URL"]) {
    if (!process.env[key]?.trim()) {
      throw new Error(`${key} is required to build the static public site.`);
    }
  }
  const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL.trim());
  if (siteUrl.protocol !== "https:" || siteUrl.username || siteUrl.password || siteUrl.pathname !== "/" || siteUrl.search || siteUrl.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTPS origin without credentials, path, query, or fragment.");
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  experimental: {
    webpackMemoryOptimizations: true,
  },
  images: {
    unoptimized: true,
    ...(imageRemotePatterns.length > 0 ? { remotePatterns: imageRemotePatterns } : {}),
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      ".cjs": [".cts", ".cjs"],
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };

    const sourceDirectory = `${path.resolve(__dirname, "src")}${path.sep}`;
    const formatterDirectory = `${path.resolve(__dirname, "src/lib/bizon-jsx")}${path.sep}`;
    webpackConfig.plugins.push({
      apply(compiler) {
        compiler.hooks.normalModuleFactory.tap("BizonJsxRuntime", (normalModuleFactory) => {
          normalModuleFactory.hooks.beforeResolve.tap("BizonJsxRuntime", (resolveData) => {
            if (!resolveData || !["react/jsx-runtime", "react/jsx-dev-runtime"].includes(resolveData.request)) {
              return;
            }

            const issuerDirectory = `${path.resolve(resolveData.context)}${path.sep}`;
            if (!issuerDirectory.startsWith(sourceDirectory) || issuerDirectory.startsWith(formatterDirectory)) {
              return;
            }

            resolveData.request = resolveData.request.endsWith("jsx-dev-runtime")
              ? "@/lib/bizon-jsx/jsx-dev-runtime"
              : "@/lib/bizon-jsx/jsx-runtime";
          });
        });
      },
    });

    return webpackConfig;
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
