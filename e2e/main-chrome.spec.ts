import { expect, test } from "@playwright/test";

test("main site uses the premium floating chrome", async ({ page }, testInfo) => {
  await page.goto("/");

  const nav = page.getByRole("navigation", {
    name: "Навигация BIZON Tires",
  });
  await expect(nav).toBeVisible();
  const catalogLink = nav.locator('a[href="/models"]');
  const tireIqLink = nav.locator('a[href="/tire-iq"]');
  await expect(catalogLink).toHaveCount(1);
  await expect(tireIqLink).toHaveCount(1);
  if (["mobile-390", "tablet-768", "laptop-1024"].includes(testInfo.project.name)) {
    await expect(catalogLink).toBeHidden();
    await expect(tireIqLink).toBeHidden();
  } else {
    await expect(catalogLink).toBeVisible();
    await expect(tireIqLink).toBeVisible();
  }
  await expect(nav.getByRole("link", { name: "Решения" })).toHaveCount(0);
  await expect(nav.getByRole("button", { name: "Корзина", exact: true })).toHaveCount(1);
  await expect(page.locator('[aria-controls="burger-menu"]')).toHaveCount(1);

  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 400);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(48);
  await expect(page.locator('[data-main-chrome][data-compact="true"]')).toBeVisible();
});

test("main burger exposes the catalog and unified cart", async ({ page }) => {
  await page.goto("/");
  await page.locator('[aria-controls="burger-menu"]').click();

  const dialog = page.getByRole("dialog", { name: "Меню BIZON Tires", exact: true });
  await expect(dialog.getByRole("link", { name: "Открыть каталог" })).toHaveAttribute("href", "/models");
  await expect(dialog.getByRole("link", { name: /^Корзина/ })).toHaveAttribute("href", "/cart");
});

test("main footer uses the shared shell with main content", async ({ page }) => {
  await page.goto("/");

  const footer = page.locator('[data-site-footer="main"]');
  await expect(footer).toHaveCount(1);
  await expect(footer.getByRole("link", { name: "Каталог шин" }).first()).toHaveAttribute("href", "/models");
  await expect(footer.getByRole("link", { name: "BIZON Shop" })).toHaveAttribute("href", "/shop");
  await expect(footer.getByRole("link", { name: "Подбор" })).toHaveCount(0);
});
