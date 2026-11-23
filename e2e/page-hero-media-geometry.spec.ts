import { expect, test } from "@playwright/test";
import contract from "../src/lib/content/pageHeroMediaContract.json" with { type: "json" };

const focal = { mobile: { x: .12, y: .23 }, tablet: { x: .34, y: .45 }, desktop: { x: .67, y: .78 } };
const positions = { mobile: "12% 23%", tablet: "34% 45%", desktop: "67% 78%" };
const { banner, aside, breakpoints, referenceViewports } = contract;
const clamp = (min: number, value: number, max: number) => Math.max(min, Math.min(value, max));
const viewports = [
  ...Object.values(referenceViewports),
  ...[767, 768, 900, 901, 1279, 1280].map(width => ({ width, height: 800 })),
  { width: 1440, height: 400 }, { width: 1440, height: 1400 },
];

for (const [key, layout] of [["payment", "banner"], ["privacy-policy", "aside"]] as const) {
  test(`public ${layout} uses the contract frame and focal breakpoints`, async ({ page, baseURL }, testInfo) => {
    const sizes = testInfo.project.name === "desktop-1440" ? viewports : [page.viewportSize()!];
    await page.route("**/*", route => {
      const url = new URL(route.request().url());
      if (url.pathname === `/v1/pages/${key}` && ["localhost", "127.0.0.1"].includes(url.hostname)) {
        return route.fulfill({ json: { hero: { title: "Geometry fixture", imageUrl: "/brand/logo-simple-black.png",
          imageAlt: "Page hero geometry fixture", imageFocalByViewport: focal } } });
      }
      return url.origin === new URL(baseURL!).origin ? route.continue() : route.abort();
    });
    await page.goto(`/${key}/`);
    const image = page.getByAltText("Page hero geometry fixture");
    await expect(image).toBeVisible();
    for (const { width, height } of sizes) {
      await test.step(`${width} × ${height}`, async () => {
        await page.setViewportSize({ width, height });
        const result = await image.evaluate(img => {
          const hero = img.closest("header")!;
          const box = img.parentElement!.getBoundingClientRect();
          return { width: box.width, height: box.height, container: hero.parentElement!.clientWidth,
            banner: hero.dataset.layout === "banner", viewport: [innerWidth, innerHeight],
            rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
            fit: getComputedStyle(img).objectFit, position: getComputedStyle(img).objectPosition };
        });
        expect(result.viewport).toEqual([width, height]);
        expect(result.banner).toBe(layout === "banner");
        const mode = width <= breakpoints.mobileMaxWidthPx ? "mobile" : width >= breakpoints.desktopMinWidthPx ? "desktop" : "tablet";
        expect(result.position).toBe(positions[mode]);
        expect(result.fit).toBe("cover");
        const { rem, container } = result;
        let expectedWidth = width;
        let expectedHeight = Math.max(banner.minHeightRem * rem, Math.min(banner.heightVh, banner.maxHeightSvh) * height / 100);
        if (layout === "aside") {
          const single = width <= breakpoints.asideSingleColumnMaxWidthPx;
          const maxWidth = clamp(aside.containerWidth.minPx, width * aside.containerWidth.widthVw / 100, aside.containerWidth.maxPx);
          const track = (single ? container : Math.min(container, maxWidth)) - 2 * aside.pageGutterPx[mode];
          const gap = clamp(aside.columnGap.minRem * rem, width * aside.columnGap.widthVw / 100, aside.columnGap.maxRem * rem);
          expectedWidth = single ? track : (track - gap) * aside.desktopColumnFraction;
          expectedHeight = mode === "mobile" ? width * aside.mobileHeightVw / 100 : clamp(aside.minHeightRem * rem, width * aside.heightVw / 100, aside.maxHeightRem * rem);
        }
        expect(Math.abs(result.width - expectedWidth)).toBeLessThan(1);
        expect(Math.abs(result.height - expectedHeight)).toBeLessThan(1);
      });
    }
  });
}
