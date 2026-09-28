import { expect, test } from "@playwright/test";

test("homepage has no tire-selection wizard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Магистральный тягач/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Продолжить" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Подобрать шины", exact: true })).toHaveCount(0);
  await expect(page.locator('a[href="/selection"]')).toHaveCount(0);
  await expect(page.locator('a[href="/#solutions"]')).toHaveCount(0);
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
});
