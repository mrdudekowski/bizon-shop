import { expect, test } from "@playwright/test";

const staticMobileRoutes = [
  "/", "/models", "/models/tbr", "/models/tbr/regional",
  "/models/tbr/regional/ci-fixture-tire", "/shop", "/shop/categories",
  "/shop/accessories", "/shop/outdoor", "/shop/wheels/forged",
  "/shop/wheels/forged/ci-fixture-wheel", "/shop/product/ci-fixture-product",
  "/shop/delivery-and-returns", "/contact", "/about", "/branding",
  "/warranty", "/become-a-supplier", "/privacy-policy", "/tire-iq",
  "/tire-iq/ci-fixture-article", "/cart", "/shop/cart",
];

test.describe("mobile responsive checks", () => {
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "mobile-only responsive checks");
});
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test("public route sweep has no document-level horizontal overflow at narrow phone widths", async ({ page }) => {
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of staticMobileRoutes) {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
      const metrics = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
      }));
      expect(metrics.document, `${route} at ${width}px`).toBeLessThanOrEqual(metrics.viewport + 1);
    }
  }
});

test("procurement form keeps optional details behind a mobile disclosure", async ({ page }) => {
  await page.goto("/contact?subject=procurement");
  const optional = page.getByText("Добавить детали к заявке");
  await expect(optional).toBeVisible();
  await expect(page.getByLabel("Типоразмер *")).toBeVisible();
  await expect(page.getByLabel("Количество *")).toBeVisible();
  await expect(page.getByLabel("Ось")).toBeHidden();
  await optional.click();
  await expect(page.getByLabel("Ось")).toBeVisible();
  await expect(page.getByLabel("Регион")).toBeVisible();
});

test("mobile contact form focuses the first required field and accepts one contact method", async ({ page }) => {
  await page.goto("/contact", { waitUntil: "domcontentloaded" });
  const name = page.getByLabel("Имя *");
  const phone = page.getByLabel("Телефон");
  const email = page.getByLabel("Email");

  await page.getByRole("button", { name: "Отправить заявку" }).click();
  await expect(name).toBeFocused();
  await expect.poll(async () => {
    const top = await name.evaluate((element) => element.getBoundingClientRect().top);
    const headerHeight = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 0);
    return top - headerHeight;
  }).toBeGreaterThanOrEqual(0);

  await name.fill("Мария");
  await expect(phone).toHaveJSProperty("required", true);
  await expect(email).toHaveJSProperty("required", true);
  await phone.fill("+7 999 111-22-33");
  await expect(email).toHaveJSProperty("required", false);
  await phone.fill("");
  await email.fill("maria@example.com");
  await expect(phone).toHaveJSProperty("required", false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("mobile contact form retains fields after an API error and shows a compact success summary", async ({ page }) => {
  let attempts = 0;
  await page.route("**/v1/requests", async (route) => {
    attempts += 1;
    await route.fulfill({
      status: attempts === 1 ? 500 : 200,
      json: attempts === 1
        ? { ok: false, message: "Временная ошибка" }
        : { ok: true, requestId: "BZN-MOBILE", message: "ok" },
    });
  });

  await page.goto("/contact", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Имя *").fill("Мария длинная фамилия для проверки переноса");
  await page.getByLabel("Телефон").fill("+7 999 111-22-33");
  const submit = page.getByRole("button", { name: "Отправить заявку" });
  await submit.click();
  await expect(page.locator("form p[role=alert]")).toContainText("Временная ошибка");
  await expect(page.getByLabel("Имя *")).toHaveValue("Мария длинная фамилия для проверки переноса");
  await expect(page.getByLabel("Телефон")).toHaveValue("+7 999 111-22-33");

  await submit.click();
  await expect(page.getByRole("heading", { name: "Заявка BZN-MOBILE принята" })).toBeVisible();
  await expect(page.locator("dd").filter({ hasText: "Мария длинная фамилия для проверки переноса" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("mobile home model cards form a swipe-only carousel without arrow controls", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const track = page.locator('div[aria-label="Ключевые модели шин"]');
  const layout = await track.evaluate((element) => {
    const style = getComputedStyle(element);
    const card = element.querySelector("a");
    return {
      flow: style.gridAutoFlow,
      overflow: style.overflowX,
      snap: style.scrollSnapType,
      trackWidth: element.clientWidth,
      cardWidth: card?.getBoundingClientRect().width ?? 0,
      cardCount: element.querySelectorAll("a").length,
      buttons: element.querySelectorAll("button").length,
    };
  });
  expect(layout.flow).toContain("column");
  expect(layout.overflow).toBe("auto");
  expect(layout.snap).toContain("x mandatory");
  expect(layout.cardWidth).toBeLessThan(layout.trackWidth);
  expect(layout.buttons).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("mobile editorial cards remove excerpts and give the specialist action priority", async ({ page }) => {
  await page.goto("/tire-iq");
  await expect(page.locator("[data-editorial-card]").first().locator("p:not([class*=meta])")).toBeHidden();
  await page.goto("/tire-iq/ci-fixture-article");
  const actions = page.getByRole("heading", { name: "Переведите знания в задачу" }).locator("xpath=..");
  await expect(actions.getByRole("link").first()).toHaveAttribute("href", "/contact/?subject=tire-selection");
});

test("mobile Tire IQ keeps selector diagrams and choices behind disclosures", async ({ page }) => {
  await page.goto("/tire-iq");
  const section = page.locator('section[aria-labelledby="axle-selector-heading"]');
  const diagram = section.locator("details").nth(0);
  const choices = section.locator("details").nth(1);
  await expect(diagram).not.toHaveAttribute("open", "");
  await expect(choices).not.toHaveAttribute("open", "");
  await diagram.getByText("Посмотреть схему").click();
  await expect(diagram.locator("img")).toBeVisible();
  await choices.getByText("Выбрать ось").click();
  await expect(choices.getByRole("link", { name: /Рулевая ось/ })).toBeVisible();
});

test("mobile truck and bus selectors keep diagrams and axle choices available on demand", async ({ page }) => {
  await page.goto("/tire-iq");

  for (const [headingId, axleName] of [
    ["dump-truck-selector-heading", "Рулевая ось"],
    ["bus-selector-heading", "Рулевая ось"],
  ]) {
    const section = page.locator(`section[aria-labelledby="${headingId}"]`);
    const diagram = section.locator("details").nth(0);
    const choices = section.locator("details").nth(1);
    await expect(diagram).not.toHaveAttribute("open", "");
    await expect(choices).not.toHaveAttribute("open", "");
    await diagram.locator("summary").click();
    const image = diagram.locator("img");
    await expect(image).toBeVisible();
    await choices.locator("summary").click();
    const axle = choices.getByRole("link", { name: new RegExp(axleName) });
    await expect(axle).toHaveAttribute("href", "/tire-iq/#knowledge");
    await axle.focus();
    await expect(image).toHaveAttribute("src", /steer-active\.svg/);
  }
});

test("mobile footer collapses link groups while keeping contact and legal links visible", async ({ page }) => {
  await page.goto("/shop");
  const footer = page.locator('footer[data-site-footer="shop"]');
  await expect(footer.locator("details")).toHaveCount(2);
  await expect(footer.getByText("BIZON SHOP", { exact: true }).first()).toBeVisible();
  await expect(footer.getByRole("link", { name: "Связаться" })).toBeVisible();
  await expect(footer.getByRole("link", { name: "Политика конфиденциальности" })).toBeVisible();
  await expect(footer.getByRole("navigation", { name: "Каталог" })).toBeHidden();
  await footer.getByText("Каталог", { exact: true }).first().click();
  await expect(footer.getByRole("navigation", { name: "Каталог" })).toBeVisible();
});

test("mobile breadcrumb keeps only the nearest parent and current item", async ({ page }) => {
  await page.goto("/models/tbr/regional/ci-fixture-tire");
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" }).first();
  await expect(breadcrumb.locator("li:visible")).toHaveCount(2);
});

test("mobile product details keep fitment and order controls before long descriptions", async ({ page }) => {
  await page.goto("/models/tbr/regional/ci-fixture-tire");
  await expect(page.getByText("Подробнее о модели")).toBeVisible();
  const facts = page.locator("dl").filter({ hasText: "Применение" }).first();
  const order = page.locator('[class*="CatalogBuyPanel_panel"]').first();
  await expect(facts).toBeVisible();
  await expect(order).toBeVisible();
  const [factsTop, orderTop] = await Promise.all([
    facts.evaluate((node) => node.getBoundingClientRect().top),
    order.evaluate((node) => node.getBoundingClientRect().top),
  ]);
  expect(orderTop).toBeGreaterThan(factsTop);

  await page.goto("/shop/product/ci-fixture-product");
  const productStory = page.locator("details").filter({ hasText: "Подробнее о товаре" });
  await expect(productStory).toBeVisible();
  await expect(productStory.locator('section[aria-labelledby="product-story-title"]')).toBeHidden();
  await productStory.locator("summary").click();
  await expect(productStory.locator('section[aria-labelledby="product-story-title"]')).toBeVisible();
});

test.describe("mobile cart routes", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("show useful empty states for tire and Shop requests", async ({ page }) => {
    for (const [route, returnAction] of [
      ["/cart", "Шины BIZON"],
      ["/shop/cart", "Каталог BIZON Shop"],
    ]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("p.info-card-text").filter({ hasText: "Корзина пуста" })).toBeVisible();
      await expect(page.getByRole("link", { name: returnAction })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    }
  });

  test("open and close the cart drawer without leaving the page scroll locked", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "domcontentloaded" });
    const trigger = page.getByRole("button", { name: "Корзина", exact: true });
    await trigger.click();

    const drawer = page.getByRole("dialog", { name: "Корзина" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Корзина пуста. Добавьте диски или товары BIZON Shop.")).toBeVisible();
    await expect(page.locator("body")).toHaveClass(/cart-open/);
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.locator("body")).not.toHaveClass(/cart-open/);
  });

  test("retain a Shop request after an API error and clear it only after success", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("bizon-cart:shop", JSON.stringify([{
        itemType: "shopProduct",
        itemId: "submit-fixture",
        name: "Тестовый товар для отправки",
        slug: "submit-fixture",
        quantity: 2,
        priceOnRequest: true,
      }]));
    });
    let attempts = 0;
    await page.route("**/v1/requests", async (route) => {
      attempts += 1;
      await route.fulfill({
        status: attempts === 1 ? 500 : 200,
        json: attempts === 1
          ? { ok: false, message: "Временная ошибка" }
          : { ok: true, requestId: "BZN-CART-MOBILE", message: "ok" },
      });
    });

    await page.goto("/shop/cart", { waitUntil: "domcontentloaded" });
    const form = page.locator("main form");
    await form.getByLabel("Имя").fill("Анна");
    await form.locator('input[name="phone"]').fill("+7 999 111-22-33");
    await form.getByLabel("Город или регион").fill("Владивосток");
    await form.locator('input[name="privacyConsent"]').check();
    const submit = form.getByRole("button", { name: "Отправить заявку BIZON Shop" });

    await submit.click();
    await expect(form.getByRole("status")).toContainText("Не удалось отправить заявку");
    await expect(form.getByLabel("Имя")).toHaveValue("Анна");
    await expect(page.locator("main").getByText("Тестовый товар для отправки")).toBeVisible();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("bizon-cart:shop") || "[]"))).toHaveLength(1);

    await submit.click();
    await expect(page.getByRole("heading", { name: "Спасибо" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("bizon-cart:shop") || "[]"))).toHaveLength(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });

  test("keep mixed Shop cart lines readable and editable above one-column checkout", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("bizon-cart:shop", JSON.stringify([{
        itemType: "shopProduct",
        itemId: "mobile-fixture",
        name: "Тестовый товар для мобильной корзины",
        slug: "mobile-fixture",
        quantity: 2,
        price: 12500,
        priceOnRequest: false,
        notes: "Длинное примечание должно переноситься внутри карточки, а не расширять страницу.",
      }, {
        itemType: "wheel",
        itemId: "mobile-wheel",
        name: "Тестовый кованый диск",
        slug: "mobile-wheel",
        quantity: 1,
        priceOnRequest: true,
      }]));
    });

    await page.goto("/shop/cart", { waitUntil: "domcontentloaded" });
    const item = page.locator("li").filter({ hasText: "Тестовый товар для мобильной корзины" }).first();
    await expect(item).toBeVisible();
    await expect(item.getByRole("button", { name: "Удалить" })).toBeVisible();
    const wheelItem = page.locator("li").filter({ hasText: "Тестовый кованый диск" }).first();
    await expect(wheelItem).toBeVisible();
    await expect(page.getByRole("heading", { name: "Кованые диски" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Товары BIZON Shop" })).toBeVisible();
    const quantity = item.locator('input[type="number"]');
    await quantity.fill("5");
    await expect(quantity).toHaveValue("5");
    await item.getByRole("button", { name: "Удалить" }).click();
    await expect(item).toHaveCount(0);
    await expect(wheelItem).toBeVisible();
    await expect(page.getByLabel("Город или регион")).toBeVisible();
    await expect(page.getByRole("button", { name: "Отправить заявку BIZON Shop" })).toBeVisible();
    const fields = await page.locator('[class*="checkoutGrid"]').evaluate((element) =>
      getComputedStyle(element).gridTemplateColumns,
    );
    expect(fields.trim().split(/\s+/)).toHaveLength(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });
});

test.describe("mobile Shop product rows", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("show a compact horizontal product summary without the listing excerpt", async ({ page }) => {
    await page.goto("/shop/accessories", { waitUntil: "domcontentloaded" });

    const productLink = page.locator('a[href="/shop/product/ci-fixture-product/"]');
    const card = page.locator("article").filter({ has: productLink }).first();
    await expect(card).toBeVisible();
    await expect(card.locator('[class*="description"]')).toBeHidden();

    const geometry = await card.evaluate((element) => {
      const media = element.children[0].getBoundingClientRect();
      const body = element.children[1].getBoundingClientRect();
      return {
        cardWidth: element.getBoundingClientRect().width,
        mediaWidth: media.width,
        bodyWidth: body.width,
        mediaTop: media.top,
        bodyTop: body.top,
      };
    });

    expect(geometry.mediaWidth).toBeLessThan(geometry.cardWidth * 0.45);
    expect(Math.abs(geometry.mediaTop - geometry.bodyTop)).toBeLessThan(2);
    expect(geometry.bodyWidth).toBeGreaterThan(geometry.mediaWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });
});

test.describe("mobile tire filter sheet", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("keeps filter controls in a bottom sheet and applies the selected values", async ({ page }) => {
    await page.goto("/models/tbr", { waitUntil: "domcontentloaded" });

    const trigger = page.getByRole("button", { name: /Фильтры/ });
    await expect(trigger).toBeVisible();
    await trigger.click();

    let sheet = page.getByRole("dialog", { name: "Фильтры каталога шин" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Закрыть фильтры" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    sheet = page.getByRole("dialog", { name: "Фильтры каталога шин" });
    const sheetBox = await sheet.boundingBox();
    expect(sheetBox?.y).toBeGreaterThan(20);
    await page.mouse.click(12, Math.floor((sheetBox?.y ?? 400) / 2));
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    sheet = page.getByRole("dialog", { name: "Фильтры каталога шин" });
    await expect(sheet).toBeVisible();
    await sheet.locator('input[name="size"]').fill("999/99R99");
    await expect(sheet.getByRole("button", { name: "Показать 0 моделей" })).toBeVisible();
    await sheet.getByRole("button", { name: "Показать 0 моделей" }).click();

    await expect(page).toHaveURL(/size=999%2F99R99/);
    await expect(page.locator("[data-tire-no-results]")).toBeVisible();
  });
});

test.describe("mobile wheel filter sheet", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("updates the result count from draft wheel filters before applying", async ({ page }) => {
    await page.goto("/shop/wheels/forged", { waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: "Фильтры" }).click();
    const sheet = page.getByRole("dialog", { name: "Параметры диска" });
    await expect(sheet).toBeVisible();
    await sheet.locator('select[name="diameter"]').selectOption("18");
    await sheet.locator('select[name="pcd"]').selectOption("5×127");
    await expect(sheet.getByRole("button", { name: "Показать 0 моделей" })).toBeVisible();
    await sheet.getByRole("button", { name: "Показать 0 моделей" }).click();

    await expect(page).toHaveURL(/diameter=18/);
    await expect(page.getByRole("heading", { name: "По заданным параметрам диски не найдены" })).toBeVisible();
  });
});

test.describe("mobile tire model cards", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("show model identity, fitment cue and action without the long card copy", async ({ page }) => {
    await page.goto("/models/tbr", { waitUntil: "domcontentloaded" });

    const card = page.locator("[data-tire-model-card]").first();
    await expect(card).toBeVisible();
    await expect(card.locator('[class*="modelDescription"]')).toBeHidden();
    await expect(card.locator('[class*="modelBrand"]')).toBeHidden();
    await expect(card.locator('[class*="modelFooter"] a')).toBeVisible();

    const geometry = await card.evaluate((element) => {
      const image = element.querySelector("a")!.getBoundingClientRect();
      const body = element.querySelector("div")!.getBoundingClientRect();
      return { imageWidth: image.width, bodyWidth: body.width, imageTop: image.top, bodyTop: body.top };
    });
    expect(geometry.bodyWidth).toBeGreaterThan(geometry.imageWidth);
    expect(Math.abs(geometry.imageTop - geometry.bodyTop)).toBeLessThan(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    const gapToFooter = await page.evaluate(() => {
      const card = document.querySelector("[data-tire-model-card]")!;
      const footer = document.querySelector("footer")!;
      return footer.getBoundingClientRect().top - card.getBoundingClientRect().bottom;
    });
    expect(gapToFooter).toBeLessThanOrEqual(140);
  });
});

test.describe("mobile technical specification disclosure", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("keeps core tire facts visible and opens the remaining fields on request", async ({ page }) => {
    await page.goto("/models/tbr/regional/ci-fixture-tire", { waitUntil: "domcontentloaded" });

    const details = page.locator("details").filter({ has: page.getByText("Все характеристики", { exact: true }) }).first();
    await expect(details).toBeVisible();
    await expect(details).not.toHaveAttribute("open", "");
    await details.locator("summary").click();
    await expect(details).toHaveAttribute("open", "");
    await expect(details.getByText("Ширина, мм", { exact: true })).toBeVisible();
  });
});

test.describe("mobile Shop home hierarchy", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("shows the next section sooner than one full phone screen", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "domcontentloaded" });

    const hero = page.getByRole("heading", { level: 1 }).locator("xpath=ancestor::section[1]");
    expect(await hero.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(760);
  });

  test("opens order-step details only when the visitor asks", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "domcontentloaded" });

    const firstStep = page.getByRole("heading", { name: "Выберите дизайн", exact: true }).locator("xpath=ancestor::article[1]");
    const disclosure = firstStep.getByRole("button", { name: /Подробнее/ });
    await expect(disclosure).toBeVisible();
    const detail = firstStep.locator("p");
    await expect(detail).toBeHidden();
    await disclosure.click();
    await expect(detail).toBeVisible();
  });
});
});

test("desktop keeps disclosure content visible and the full breadcrumb trail", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "desktop regression check");
  await page.goto("/shop/product/ci-fixture-product");
  await expect(page.locator('section[aria-labelledby="product-story-title"]')).toBeVisible();
  await page.goto("/models/tbr/regional/ci-fixture-tire");
  await expect(page.getByRole("navigation", { name: "Breadcrumb" }).first().locator("li:visible").first()).toBeVisible();
  await expect(page.locator("footer details nav").first()).toBeVisible();
});
