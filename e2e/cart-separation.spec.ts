import { expect, test } from "@playwright/test";

const tire = { itemType: "tire", itemId: "e2e-tire", name: "Isolation tire", quantity: 2 };
const wheel = { itemType: "wheel", itemId: "e2e-wheel", name: "Isolation wheel", quantity: 1 };
const product = { itemType: "shopProduct", itemId: "e2e-cap", name: "Isolation cap", quantity: 3 };

async function seedTypedCarts(page: import("@playwright/test").Page) {
  await page.addInitScript(({ tireItem, wheelItem, productItem }) => {
    localStorage.setItem("bizon-cart:bizon", JSON.stringify([tireItem]));
    localStorage.setItem("bizon-cart:shop", JSON.stringify([wheelItem, productItem]));
    localStorage.setItem("bizon-cart:migrated-v2", "true");
    localStorage.setItem("bizon-cart:server-migrated-v2", "true");
  }, { tireItem: tire, wheelItem: wheel, productItem: product });
  await page.route("**/v1/cart**", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { ok: true, hasSession: false, items: [] } });
    return route.fulfill({ json: { ok: true } });
  });
}

async function fillContactForm(page: import("@playwright/test").Page, suffix: string) {
  await page.locator('input[name="name"]').fill(`E2E ${suffix}`);
  await page.locator('input[name="phone"]').fill("+79990000000");
  await page.locator('input[name="city"]').fill("Владивосток");
  await page.locator('input[name="privacyConsent"]').check();
}

test("Bizon and Shop headers, drawers, and cart pages show only their own lines", async ({ page }) => {
  await seedTypedCarts(page);
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  const mainScroll = await page.evaluate(() => window.scrollY);

  const mainTrigger = page.getByRole("button", { name: /^Корзина, 2/, exact: true });
  await expect(mainTrigger).toBeVisible();
  await mainTrigger.click();
  const mainDrawer = page.getByRole("dialog", { name: "Корзина", exact: true });
  await expect(page.locator(".page")).toHaveAttribute("inert", "");
  await expect(mainDrawer.getByText("Isolation tire")).toBeVisible();
  await expect(mainDrawer.getByText("Isolation wheel")).toHaveCount(0);
  await expect(mainDrawer.getByText("Isolation cap")).toHaveCount(0);
  await expect(mainDrawer.getByRole("link", { name: "Перейти к заявке" })).toHaveAttribute("href", "/cart");
  await page.keyboard.press("Escape");
  await expect(mainTrigger).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(mainScroll);

  await page.goto("/shop");
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  const shopScroll = await page.evaluate(() => window.scrollY);
  const shopTrigger = page.getByRole("button", { name: /^Корзина, 4/, exact: true });
  await expect(shopTrigger).toBeVisible();
  await shopTrigger.click();
  const shopDrawer = page.getByRole("dialog", { name: "Корзина", exact: true });
  await expect(page.locator(".page")).toHaveAttribute("inert", "");
  await expect(shopDrawer.getByText("Isolation tire")).toHaveCount(0);
  await expect(shopDrawer.getByText("Isolation wheel")).toBeVisible();
  await expect(shopDrawer.getByText("Isolation cap")).toBeVisible();
  await expect(shopDrawer.getByRole("link", { name: "Перейти к заявке" })).toHaveAttribute("href", "/shop/cart");
  await page.keyboard.press("Escape");
  await expect(shopTrigger).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(shopScroll);

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Шины" })).toBeVisible();
  await expect(page.getByText("Isolation tire")).toBeVisible();
  await expect(page.getByText("Isolation wheel")).toHaveCount(0);
  await expect(page.getByText("Isolation cap")).toHaveCount(0);

  await page.goto("/shop/cart");
  await expect(page.getByRole("heading", { name: "Кованые диски" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Товары BIZON Shop" })).toBeVisible();
  await expect(page.getByText("Isolation tire")).toHaveCount(0);
  await expect(page.getByText("Isolation wheel")).toBeVisible();
  await expect(page.getByText("Isolation cap")).toBeVisible();
  const shopFieldNames = await page.locator("form input, form select, form textarea").evaluateAll((fields) => fields.map((field) => (field as HTMLInputElement).name));
  await page.goto("/cart");
  const bizonFieldNames = await page.locator("form input, form select, form textarea").evaluateAll((fields) => fields.map((field) => (field as HTMLInputElement).name));
  expect(bizonFieldNames).toEqual(shopFieldNames);
});

test("Bizon and Shop submit distinct requests and success clears only the submitted cart", async ({ page }) => {
  test.skip(!process.env.NEXT_PUBLIC_API_URL, "Requires a built site with a request API configured");
  await seedTypedCarts(page);
  const submitted: Record<string, unknown>[] = [];
  await page.route("**/v1/requests", async (route) => {
    submitted.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, json: { ok: true, requestId: "e2e" } });
  });

  await page.goto("/cart");
  await fillContactForm(page, "Bizon");
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByRole("heading", { name: "Спасибо" })).toBeVisible();
  await expect.poll(() => submitted).toHaveLength(1);
  expect(submitted[0]).toMatchObject({ sourceForm: "tire_cart", sourcePage: "/cart", items: [tire] });
  await expect.poll(() => page.evaluate(() => localStorage.getItem("bizon-cart:bizon"))).toBe("[]");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("bizon-cart:shop") || "[]"))).toEqual([wheel, product]);

  await page.goto("/shop/cart");
  await fillContactForm(page, "Shop");
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByRole("heading", { name: "Спасибо" })).toBeVisible();
  await expect.poll(() => submitted).toHaveLength(2);
  expect(submitted[1]).toMatchObject({ sourceForm: "shop_cart", sourcePage: "/shop/cart", items: [wheel, product] });
  await expect.poll(() => page.evaluate(() => localStorage.getItem("bizon-cart:shop"))).toBe("[]");
});

test("failed request retains cart lines and entered form values", async ({ page }) => {
  test.skip(!process.env.NEXT_PUBLIC_API_URL, "Requires a built site with a request API configured");
  await seedTypedCarts(page);
  await page.route("**/v1/requests", (route) => route.fulfill({ status: 500, json: { ok: false } }));
  await page.goto("/cart");
  await fillContactForm(page, "Retry");
  await page.locator('form button[type="submit"]').click();

  await expect(page.getByRole("status")).toContainText("Не удалось отправить заявку");
  await expect(page.locator('input[name="name"]')).toHaveValue("E2E Retry");
  await expect(page.locator('input[name="phone"]')).toHaveValue("+79990000000");
  await expect(page.getByText("Isolation tire")).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("bizon-cart:bizon") || "[]"))).toEqual([tire]);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("bizon-cart:shop") || "[]"))).toEqual([wheel, product]);
});

for (const firstRoute of ["/cart", "/shop/cart"] as const) {
  test(`legacy local cart splits once when ${firstRoute} loads first and stays stable after reload`, async ({ page }) => {
    await page.addInitScript(({ tireItem, wheelItem, productItem }) => {
      const legacyItems = [tireItem, wheelItem, productItem];
      localStorage.setItem("bizon-cart", JSON.stringify(legacyItems));
      document.cookie = `bizon-cart-v1=${encodeURIComponent(JSON.stringify(legacyItems))}; Path=/; SameSite=Lax`;
    }, { tireItem: tire, wheelItem: { ...wheel, quantity: 4 }, productItem: product });
    await page.route("**/v1/cart**", async (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({ json: { ok: true, bizonItems: [tire], shopItems: [{ ...wheel, quantity: 4 }, product], unmappedItems: [] } });
      }
      if (route.request().method() === "GET") return route.fulfill({ json: { ok: true, hasSession: false, items: [] } });
      return route.fulfill({ json: { ok: true } });
    });

    await page.goto(firstRoute);
    await expect(page.getByText(firstRoute === "/cart" ? "Isolation tire" : "Isolation wheel")).toBeVisible();
    await page.goto(firstRoute === "/cart" ? "/shop/cart" : "/cart");
    await expect(page.getByText(firstRoute === "/cart" ? "Isolation wheel" : "Isolation tire")).toBeVisible();
    await page.reload();
    await expect(page.getByText(firstRoute === "/cart" ? "Isolation wheel" : "Isolation tire")).toBeVisible();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("bizon-cart:bizon") || "[]"))).toEqual([tire]);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("bizon-cart:shop") || "[]"))).toEqual([{ ...wheel, quantity: 4 }, product]);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("bizon-cart"))).toBeNull();
  });
}
