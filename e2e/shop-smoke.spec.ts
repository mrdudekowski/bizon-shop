import { expect, test } from "@playwright/test";

const SHOP_ROUTES = [
  "/shop",
  "/shop/categories",
  "/shop/accessories",
  "/shop/outdoor",
  "/shop/wheels/forged",
  "/shop/wheels/forged/ci-fixture-wheel",
  "/shop/delivery-and-returns",
  "/cart",
] as const;

test("supplier proof heading does not create horizontal page overflow", async ({ page }) => {
  const response = await page.goto("/become-a-supplier", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Работаем с профессиональным рынком" })).toBeVisible();
  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(widths.document, `supplier page overflows at ${widths.viewport}px`).toBeLessThanOrEqual(widths.viewport + 1);
});

for (const route of SHOP_ROUTES) {
  test(`${route} renders without horizontal overflow`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1"), `${route} h1`).toHaveCount(1);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow, `${route} horizontal overflow`).toBe(false);
  });
}

test("burger and cart drawers trap focus and close with Escape", async ({ page }) => {
  await page.goto("/shop", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");

  const menuTrigger = page.locator('[aria-controls="burger-menu"]');
  await expect(menuTrigger).toHaveCount(1);
  await menuTrigger.click();

  const menuDialog = page.getByRole("dialog", { name: "Меню BIZON Shop", exact: true });
  await expect(menuDialog).toBeVisible();
  await expect(page.locator(".page")).toHaveAttribute("inert", "");
  await page.keyboard.press("Escape");
  await expect(menuDialog).toBeHidden();
  await expect(menuTrigger).toBeFocused();

  const cartTrigger = page.getByRole("button", { name: "Корзина", exact: true });
  await expect(cartTrigger).toHaveCount(1);
  await cartTrigger.click();

  const cartDialog = page.getByRole("dialog", { name: "Корзина", exact: true });
  await expect(cartDialog).toBeVisible();
  await expect(page.locator(".page")).toHaveAttribute("inert", "");
  await page.keyboard.press("Escape");
  await expect(cartDialog).toBeHidden();
  await expect(cartTrigger).toBeFocused();
});

test("burger preserves the current scroll position", async ({ page }) => {
  await page.goto("/shop", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.scrollTo(0, 2200));
  const before = await page.evaluate(() => window.scrollY);

  await page.locator('[aria-controls="burger-menu"]').click();
  await page.keyboard.press("Escape");

  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
});

test("desktop shop navbar distributes catalog and wheels links symmetrically", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop-1440",
    "Desktop navigation only",
  );
  await page.goto("/shop", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");

  const nav = page.getByRole("navigation", { name: "Навигация BIZON Shop", exact: true });
  await expect(nav.getByRole("link", { name: "Каталог", exact: true })).toHaveAttribute("href", "/shop/categories/");
  await expect(nav.getByRole("link", { name: "Диски", exact: true })).toHaveAttribute("href", "/shop/wheels/forged/");
  await expect(nav.getByRole("link", { name: "Заявка", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Возврат", exact: true })).toBeVisible();
});

test("shop burger exposes wheel selection and links to the Shop cart", async ({ page }) => {
  await page.goto("/shop");
  await page.locator('[aria-controls="burger-menu"]').click();

  const dialog = page.getByRole("dialog", { name: "Меню BIZON Shop", exact: true });
  await expect(dialog.getByRole("link", { name: "Выбрать диски" })).toHaveAttribute("href", "/shop/#wheels");
  await expect(dialog.getByRole("link", { name: /^Корзина/ })).toHaveAttribute("href", "/shop/cart/");
});

test("shop homepage keeps forged wheels, published categories and vehicle stories", async ({ page }) => {
  await page.goto("/shop");

  await expect(page.locator("section").first().getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Категории товаров" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Приостановить карусель" })).toHaveCount(0);

  const vehicleBackground = await page.locator('[data-shop-section="vehicles"]').evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  expect(vehicleBackground).toBe("rgb(255, 255, 255)");
});

test("shop footer uses the shared shell with shop content", async ({ page }, testInfo) => {
  await page.goto("/shop");

  const footer = page.locator('[data-site-footer="shop"]');
  await expect(footer).toHaveCount(1);
  await expect(footer.getByRole("link", { name: "Выбрать диски" })).toHaveAttribute("href", "/shop/#wheels");
  if (testInfo.project.name === "mobile-390") {
    await footer.locator("summary").filter({ hasText: "Помощь" }).click();
  }
  await expect(footer.getByRole("link", { name: /BIZON Tires/ })).toHaveAttribute("href", "/");
});

test("cart drawer preserves the current scroll position", async ({ page }) => {
  await page.goto("/shop");
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 2200);
  });
  const before = await page.evaluate(() => window.scrollY);

  await page.getByRole("button", { name: /^Корзина/ }).evaluate((button: HTMLButtonElement) => {
    button.click();
  });
  await expect(page.locator("body")).toHaveClass(/cart-open/);
  await page.keyboard.press("Escape");

  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
});

test("forged wheel SEO includes published snapshot models", async ({ page, request }) => {
  await page.goto("/shop/wheels/forged/ci-fixture-wheel", { waitUntil: "domcontentloaded" });
  const productSchemas = await page.locator('script[type="application/ld+json"]').evaluateAll(
    (scripts) => scripts
      .map((script) => JSON.parse(script.textContent || "{}"))
      .filter((schema) => schema["@type"] === "Product"),
  );
  expect(productSchemas).toHaveLength(1);
  expect(productSchemas[0].name).toBe("CI fixture wheel");

  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.status()).toBe(200);
  const sitemap = await sitemapResponse.text();
  expect(sitemap).toContain("/shop/wheels/forged/ci-fixture-wheel");
  expect(sitemap).not.toContain("/shop/glasses");
  expect(sitemap).not.toContain("/shop/merch");
});
