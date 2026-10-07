import { expect, test } from "@playwright/test";

test("tire iq listing and detail use editorial story templates", async ({ page }) => {
  await page.goto("/tire-iq");
  await expect(page.getByRole("heading", { level: 1, name: "Tire IQ" })).toBeVisible();
  const card = page.locator("[data-editorial-card]").first();
  await expect(card).toBeVisible();
  await card.getByRole("link").first().click();
  await expect(page).toHaveURL(/\/tire-iq\/.+/);
  await expect(page.getByRole("link", { name: /Все статьи/ })).toBeVisible();
});
