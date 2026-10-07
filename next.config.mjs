import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildImageRemotePatterns } from "./src/lib/images/remotePatterns.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const imageRemotePatterns = buildImageRemotePatterns();

if (process.env.NODE_ENV === "production") {
  for (const key of ["CONTENT_API_URL", "NEXT_PUBLIC_API_URL"]) {
    if (!process.env[key]?.trim()) {
      throw new Error(`${key} is required to build the static public site.`);
    }
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
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

    return webpackConfig;
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
