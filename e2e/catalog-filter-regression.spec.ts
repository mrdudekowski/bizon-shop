import { expect, test } from "@playwright/test";

test("forged wheel filters combine, survive reload, and can be reset", async ({ page }) => {
  await page.goto("/shop/wheels/forged/?designStyle=Off-road&diameter=18&pcd=6%C3%97139.7");

  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("CI fixture forged wheels");
  await expect(page.locator('select[name="designStyle"]')).toHaveValue("Off-road");
  await expect(page.locator('select[name="diameter"]')).toHaveValue("18");
  await expect(page.locator('select[name="pcd"]')).toHaveValue("6×139.7");
  await expect(page.locator(".catalog-card")).toHaveCount(1);
  await expect(page.getByText("1 модель", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.locator('select[name="designStyle"]')).toHaveValue("Off-road");
  await expect(page.locator('select[name="diameter"]')).toHaveValue("18");
  await expect(page.locator('select[name="pcd"]')).toHaveValue("6×139.7");
  await expect(page.locator(".catalog-card")).toHaveCount(1);

  await page.goto("/shop/wheels/forged/?designStyle=Off-road&diameter=18&pcd=5%C3%97127");
  await expect(page.getByRole("heading", { name: "По заданным параметрам диски не найдены" })).toBeVisible();
  await expect(page.getByText("0 моделей", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Очистить фильтры" }).click();
  await expect(page.locator(".catalog-card")).toHaveCount(2);

  const gridLayout = await page.locator(".catalog-card").first().evaluate((card) => {
    const parent = card.parentElement!;
    const computed = getComputedStyle(parent);
    return {
      display: computed.display,
      columns: computed.gridTemplateColumns,
      parentWidth: parent.offsetWidth,
      cardWidth: (card as HTMLElement).offsetWidth,
    };
  });
  expect(gridLayout.display).toBe("grid");
  expect(gridLayout.columns).not.toBe("none");
  expect(gridLayout.cardWidth).toBeLessThanOrEqual(gridLayout.parentWidth);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
  if (page.viewportSize()?.width === 1440) {
    await page.screenshot({ path: "test-results/forged-catalog-desktop.png", fullPage: true });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileLayout = await page.locator(".catalog-card").first().evaluate((card) => {
    const parent = card.parentElement!;
    const computed = getComputedStyle(parent);
    return {
      display: computed.display,
      columns: computed.gridTemplateColumns,
      parentWidth: parent.offsetWidth,
      cardWidth: (card as HTMLElement).offsetWidth,
    };
  });
  expect(mobileLayout.display).toBe("grid");
  expect(mobileLayout.columns).not.toBe("none");
  expect(mobileLayout.cardWidth).toBeLessThanOrEqual(mobileLayout.parentWidth);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("tire filters combine, survive reload, and report an empty result", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-390", "mobile filter sheet behavior is covered by mobile-responsive.spec.ts");
  await page.goto("/models/tbr/?application=regional&axle=drive&size=315%2F80R22.5");

  await expect(page.locator('select[name="application"]')).toHaveValue("regional");
  await expect(page.locator('select[name="axle"]')).toHaveValue("drive");
  await expect(page.locator('input[name="size"]')).toHaveValue("315/80R22.5");
  await expect(page.locator("[data-tire-model-card]:visible")).toHaveCount(1);

  await page.reload();
  await expect(page.locator('select[name="application"]')).toHaveValue("regional");
  await expect(page.locator('select[name="axle"]')).toHaveValue("drive");
  await expect(page.locator('input[name="size"]')).toHaveValue("315/80R22.5");
  await expect(page.locator("[data-tire-model-card]:visible")).toHaveCount(1);

  await page.goto("/models/tbr/?application=long_haul&axle=drive&size=315%2F80R22.5");
  await expect(page.locator("[data-tire-result-count]")).toHaveText("0 моделей");
  await expect(page.locator("[data-tire-no-results]")).toBeVisible();
  await page.getByRole("link", { name: "Сбросить фильтры" }).click();
  await expect(page.locator("[data-tire-model-card]:visible")).toHaveCount(1);
});
