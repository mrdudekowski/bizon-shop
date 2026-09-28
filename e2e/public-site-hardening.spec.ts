import { expect, test } from "@playwright/test";

test("legacy selection URL redirects to the catalog", async ({ page }) => {
  await page.goto("/selection");
  await expect(page).toHaveURL(/\/models\/?$/);
});

test("reduced motion disables decorative transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const duration = await page.evaluate(() => {
    const chrome = document.querySelector("[data-main-chrome]");
    if (!chrome) return null;
    return getComputedStyle(chrome).transitionDuration;
  });

  expect(duration).not.toBeNull();
  expect(Number.parseFloat(duration ?? "1")).toBeLessThanOrEqual(0.01);
});

test("primary dark token resolves to pure black", async ({ page }) => {
  await page.goto("/shop");

  const black = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = "var(--bizon-black)";
    document.body.append(probe);
    const resolved = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return resolved;
  });

  expect(black).toBe("rgb(0, 0, 0)");
});

test("long Russian headings stay within the hero title track", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => {
    const heading = document.querySelector("h1");
    if (heading) {
      heading.textContent = "Ресурс для реальной работы на длинных региональных маршрутах с повышенной нагрузкой";
    }
  });

  const titleOverflow = await page.evaluate(() => {
    const heading = document.querySelector("h1");
    if (!heading) return true;
    return heading.scrollWidth > heading.clientWidth;
  });
  expect(titleOverflow).toBe(false);
});
