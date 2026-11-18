import { expect, test } from "@playwright/test";

test("privacy page headings with long CMS words do not widen the mobile page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/privacy-policy/", { waitUntil: "domcontentloaded" });
  const heading = page.locator("main h1");
  await expect(heading).toBeVisible();
  await heading.evaluate((element) => {
    element.textContent = "КонфиденциальностьПерсональныхДанныхИЗащитаПравПользователей";
  });

  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    heading: document.querySelector("main h1")?.scrollWidth ?? 0,
    headingClient: document.querySelector("main h1")?.clientWidth ?? 0,
  }));

  expect(metrics.document, "document must stay within the mobile viewport").toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.heading, "heading text must wrap within its box").toBeLessThanOrEqual(metrics.headingClient + 1);
});
