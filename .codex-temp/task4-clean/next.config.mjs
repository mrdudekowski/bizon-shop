import path from "node:path";
import { fileURLToPath } from "node:url";
import { withPayload } from "@payloadcms/next/withPayload";

import { buildImageRemotePatterns } from "./src/lib/images/remotePatterns.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const imageRemotePatterns = buildImageRemotePatterns();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@payloadcms/storage-s3", "@payloadcms/plugin-cloud-storage"],
  ...(imageRemotePatterns.length > 0
    ? { images: { remotePatterns: imageRemotePatterns } }
    : {}),
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

export default withPayload(nextConfig, { devBundleServerPackages: false });
