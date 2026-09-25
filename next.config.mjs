/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pg"],
  // Dev compiles a screen on first open and drops it after a minute.
  // Keep the admin screens compiled for the working session.
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 100,
  },
};

export default nextConfig;
