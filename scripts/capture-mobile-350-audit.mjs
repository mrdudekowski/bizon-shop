import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const baseURL = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const output = resolve("docs/superpowers/reports/mobile-350-2026-10-15");
const routes = [
  ["home", "/"],
  ["models", "/models"],
  ["models-tbr", "/models/tbr"],
  ["models-tbr-regional", "/models/tbr/regional"],
  ["tire-detail", "/models/tbr/regional/dsr188"],
  ["shop-home", "/shop"],
  ["shop-categories", "/shop/categories"],
  ["shop-accessories", "/shop/accessories"],
  ["shop-outdoor", "/shop/outdoor"],
  ["shop-forged-wheels", "/shop/wheels/forged"],
  ["wheel-detail", "/shop/wheels/forged/atlas"],
  ["shop-product", "/shop/product/mega-pritsep"],
  ["delivery-returns", "/shop/delivery-and-returns"],
  ["contact", "/contact"],
  ["about", "/about"],
  ["branding", "/branding"],
  ["warranty", "/warranty"],
  ["become-supplier", "/become-a-supplier"],
  ["privacy-policy", "/privacy-policy"],
  ["tire-iq", "/tire-iq"],
  ["tire-iq-article", "/tire-iq/construction-route-tire-check"],
  ["tire-cart", "/cart"],
  ["shop-cart", "/shop/cart"],
];

await mkdir(resolve(output, "first-screen"), { recursive: true });
await mkdir(resolve(output, "full-page"), { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 350, height: 820 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "ru-RU",
  timezoneId: "Asia/Vladivostok",
});
const results = [];

for (const [name, path] of routes) {
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto(new URL(path, baseURL).href, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  }).catch(() => null);
  await page.locator("body").waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(350);

  await page.screenshot({
    path: resolve(output, "first-screen", `${name}.png`),
    animations: "disabled",
  });

  // Trigger lazy images and reveal-on-scroll content before the full-page capture.
  await page.evaluate(async () => {
    const step = Math.max(400, window.innerHeight - 100);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolveFrame) => requestAnimationFrame(() => setTimeout(resolveFrame, 60)));
    }
    window.scrollTo(0, 0);
    await new Promise((resolveFrame) => requestAnimationFrame(resolveFrame));
  });
  await page.waitForTimeout(250);

  const metrics = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const offenders = [...document.querySelectorAll("body *")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className.slice(0, 100) : "",
          text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 70),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          overflowX: style.overflowX,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
        };
      })
      .filter((item) => item.width > 0 && (item.left < -1 || item.right > viewport + 1))
      .slice(0, 15);
    const images = [...document.images].map((image) => ({
      src: image.currentSrc || image.src,
      loaded: image.complete && image.naturalWidth > 0,
    }));
    return {
      title: document.title,
      h1: [...document.querySelectorAll("h1")].map((node) => node.innerText.trim()),
      width: { viewport, document: document.documentElement.scrollWidth },
      height: document.documentElement.scrollHeight,
      headings: [...document.querySelectorAll("main h2, main h3")].map((node) => node.innerText.trim()).filter(Boolean),
      imageCount: images.length,
      brokenImages: images.filter((image) => !image.loaded).map((image) => image.src),
      horizontalOverflowCandidates: offenders,
    };
  });

  await page.screenshot({
    path: resolve(output, "full-page", `${name}.png`),
    fullPage: true,
    animations: "disabled",
    timeout: 45_000,
  });
  results.push({ name, path, status: response?.status() ?? null, ...metrics, consoleErrors, pageErrors });
  console.log(`${name}: HTTP ${response?.status() ?? "no response"}, ${metrics.width.viewport}/${metrics.width.document}px, ${metrics.height}px tall, ${metrics.brokenImages.length} broken image(s)`);
  await page.close();
}

await writeFile(resolve(output, "manifest.json"), JSON.stringify({
  capturedAt: new Date().toISOString(),
  baseURL,
  viewport: { width: 350, height: 820, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  routeCount: routes.length,
  results,
}, null, 2));
await browser.close();
console.log(`Saved ${routes.length} route pairs to ${output}`);
