import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = `http://localhost:${port}`;
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `python -m http.server ${port} --bind 127.0.0.1 --directory out`,
    url: `${baseURL}/shop`,
    reuseExistingServer,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "ignore",
  },
  projects: [
    {
      name: "mobile-390",
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
    {
      name: "tablet-768",
      use: { viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    {
      name: "laptop-1024",
      use: { viewport: { width: 1024, height: 900 } },
    },
    {
      name: "desktop-1440",
      use: { viewport: { width: 1440, height: 1000 } },
    },
  ],
});
