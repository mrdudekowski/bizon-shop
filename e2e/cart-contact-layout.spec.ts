import { expect, test } from "@playwright/test";

test("contact form fields stay inside the form card on narrow screens", async ({ page }) => {
  await page.route("**/v1/**", (route) => route.abort());
  for (const route of ["/contact/", "/contact/?subject=procurement"]) {
    await page.goto(route);
    await expect(page.locator("form").first()).toBeVisible();

    for (const width of [320, 360, 390, 640, 767, 768, 899, 900, 1024]) {
      await page.setViewportSize({ width, height: 1018 });
      const geometry = await page.evaluate(() => {
        const formElement = document.querySelector("form");
        if (!formElement) throw new Error("contact form not found");
        const formRight = formElement.getBoundingClientRect().right;
        const fields = Array.from(formElement.querySelectorAll("input:not([aria-hidden='true']), textarea, select"));
        const fieldRight = Math.max(...fields.map((field) => field.getBoundingClientRect().right));
        return { viewport: window.innerWidth, document: document.documentElement.scrollWidth, formRight, fieldRight };
      });

      expect(geometry.document, `${route}: document overflow at ${width}px`).toBeLessThanOrEqual(geometry.viewport);
      expect(geometry.fieldRight, `${route}: field overflow at ${width}px`).toBeLessThanOrEqual(geometry.formRight + 1);
    }
  }
});
