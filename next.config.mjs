import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the CMS independent from the public site's lockfile in the parent folder.
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "s3.twcstorage.ru", pathname: "/**" },
    ],
  },
  serverExternalPackages: ["pg"],
  // Dev compiles a screen on first open and drops it after a minute.
  // Keep the admin screens compiled for the working session.
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 100,
  },
};

export default nextConfig;
