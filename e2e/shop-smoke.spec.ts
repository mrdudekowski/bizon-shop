import { expect, test } from "@playwright/test";

const SHOP_ROUTES = [
  "/shop",
  "/shop/categories",
  "/shop/accessories",
  "/shop/outdoor",
  "/shop/wheels/forged",
  "/shop/wheels/forged/atlas",
  "/shop/delivery-and-returns",
  "/cart",
] as const;

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

test("desktop categories menu toggles and restores focus", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop-1440",
    "Desktop navigation only",
  );
  await page.goto("/shop", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");

  const trigger = page.getByRole("button", { name: "Категории", exact: true });
  await expect(trigger).toHaveCount(1);
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const menu = page.locator("#shop-category-menu");
  await expect(menu.getByRole("link", { name: "Все категории" })).toBeVisible();
  await expect(menu.getByRole("link")).not.toHaveCount(0);

  await trigger.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("shop burger exposes wheel selection and unified cart", async ({ page }) => {
  await page.goto("/shop");
  await page.locator('[aria-controls="burger-menu"]').click();

  const dialog = page.getByRole("dialog", { name: "Меню BIZON Shop", exact: true });
  await expect(dialog.getByRole("link", { name: "Выбрать диски" })).toHaveAttribute("href", "/shop#wheels");
  await expect(dialog.getByRole("link", { name: /^Корзина/ })).toHaveAttribute("href", "/cart");
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

test("shop footer uses the shared shell with shop content", async ({ page }) => {
  await page.goto("/shop");

  const footer = page.locator('[data-site-footer="shop"]');
  await expect(footer).toHaveCount(1);
  await expect(footer.getByRole("link", { name: "Выбрать диски" })).toHaveAttribute("href", "/shop#wheels");
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

test("unified cart separates commercial intents and submits one request", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("bizon-cart", JSON.stringify([
      { itemType: "tire", itemId: "selection:1", name: "Подбор шин", quantity: 1, priceOnRequest: true },
      { itemType: "wheel", itemId: "atlas", name: "BIZON Atlas", quantity: 4, priceOnRequest: true },
      { itemType: "shopProduct", itemId: "cap", name: "BIZON Cap", quantity: 1, priceOnRequest: false, price: 3000 },
    ]));
  });
  await page.goto("/cart");

  await expect(page.getByRole("heading", { name: "Подбор шин" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Кованые диски" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Товары BIZON Shop" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Отправить общую заявку" })).toBeVisible();
});

test("Forged SEO includes approved static designs", async ({ page, request }) => {
  await page.goto("/shop/wheels/forged/atlas", { waitUntil: "domcontentloaded" });
  const productSchemas = await page.locator('script[type="application/ld+json"]').evaluateAll(
    (scripts) => scripts
      .map((script) => JSON.parse(script.textContent || "{}"))
      .filter((schema) => schema["@type"] === "Product"),
  );
  expect(productSchemas).toHaveLength(1);
  expect(productSchemas[0].name).toBe("BIZON Atlas");

  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.status()).toBe(200);
  const sitemap = await sitemapResponse.text();
  for (const slug of ["atlas", "vector", "nomad", "ember", "bastion"]) {
    expect(sitemap).toContain(`/shop/wheels/forged/${slug}`);
  }
  expect(sitemap).not.toContain("/shop/glasses");
  expect(sitemap).not.toContain("/shop/merch");
});
