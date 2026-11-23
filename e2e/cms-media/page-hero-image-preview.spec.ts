import path from "node:path";
import { createRequire } from "node:module";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { loadCmsMediaE2EEnvironment, readCmsMediaE2EConfig } from "../../scripts/e2e/cms-media/environment";
import { restoreOwnedDraft } from "../../scripts/e2e/cms-media/restoreOwnedDraft";
import contract from "../../src/lib/content/pageHeroMediaContract.json" with { type: "json" };

type Mode = keyof typeof contract.referenceViewports;
type Point = { x: number; y: number };
type Draft = { hero: { image?: { assetId: string; focalByViewport?: Record<Mode, Point> } | null } };
type PageRecord = { draft: Draft; savedDraft: Draft | null; publishedSnapshot: Draft | null };
type Asset = { id: string; name: string; mimeType: string; dataUrl: string; replacementPending?: boolean };

const env = loadCmsMediaE2EEnvironment();
const config = readCmsMediaE2EConfig(env);
const cmsRoot = path.resolve(env.CMS_MEDIA_E2E_FRONTEND_ROOT || "frontend-cms");
const cmsRequire = createRequire(path.join(cmsRoot, "package.json"));
const { pageHeroPreviewGeometry } = cmsRequire("./src/admin/pages/pageHeroPreviewGeometry.ts") as {
  pageHeroPreviewGeometry(input: { pageKey: string; viewportWidth: number; viewportHeight: number }):
    { width: number; height: number; layout: string };
};
const modes = [
  { key: "mobile", label: "Мобильный", arrow: "Shift+ArrowUp", position: "50% 55%", point: { x: .5, y: .55 } },
  { key: "tablet", label: "Планшет", arrow: "Shift+ArrowDown", position: "50% 45%", point: { x: .5, y: .45 } },
  { key: "desktop", label: "Desktop", arrow: "ArrowUp", position: "50% 51%", point: { x: .5, y: .51 } },
] as const;
const HERO_IMAGE_FIXTURE = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="800" viewBox="0 0 200 800"><rect width="200" height="800" fill="#31475f"/><circle cx="100" cy="620" r="62" fill="#e9532f"/></svg>');

async function rpc<T>(page: Page, method: string, ...args: unknown[]): Promise<T> {
  const response = await page.request.post(`${config.apiUrl}/v1/admin`, { data: { method, args } });
  expect(response.ok(), method).toBeTruthy();
  const body = await response.json();
  expect(body.ok, method).toBe(true);
  return body.result;
}

async function save(page: Page, key: string): Promise<Draft> {
  const [response] = await Promise.all([
    page.waitForResponse(response => {
      const request = response.request();
      if (response.url() !== `${config.apiUrl}/v1/admin` || request.method() !== "POST") return false;
      const call = request.postDataJSON();
      return call?.method === "savePage" && call.args?.[0] === key;
    }),
    page.getByRole("button", { name: "Сохранить", exact: true }).click(),
  ]);
  const body = await response.json();
  if (!response.ok() || !body.ok || !body.result?.savedDraft) {
    throw new Error(`CMS did not confirm saving the ${key} draft (${body.code ?? response.status()})`);
  }
  return body.result.savedDraft;
}

async function reloadSavedPage(page: Page) {
  await expect(page.getByText("Черновик сохранён", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("group", { name: "Изображение шапки", exact: true })).toBeVisible();
}

async function libraryItem(page: Page, field: Locator, asset: Asset) {
  await field.getByRole("button", { name: "Выбрать из галереи" }).click();
  const picker = page.getByRole("dialog", { name: "Выбрать изображение" });
  await picker.getByLabel("Показывать используемые").check();
  await picker.getByLabel("Поиск по имени").fill(asset.name);
  return picker.getByRole("button", { name: `Выбрать ${asset.name}`, exact: true });
}

async function verifyFrame(field: Locator, key: string, mode: Mode) {
  const { width, height } = contract.referenceViewports[mode];
  const reference = pageHeroPreviewGeometry({ pageKey: key, viewportWidth: width, viewportHeight: height });
  const frame = field.locator(`[data-page-hero-preview="${reference.layout}"][data-preview-viewport="${mode}"]`);
  await expect(frame).toBeVisible();
  await expect.poll(async () => frame.evaluate((node, expected) => {
    const rect = node.getBoundingClientRect();
    const parent = node.parentElement!.getBoundingClientRect();
    const cap = parseFloat(getComputedStyle(node).getPropertyValue("--cms-preview-max"));
    if (!(cap > 0)) return false;
    const scale = Math.min(1, parent.width / expected.width, cap / expected.height);
    return scale > 0 && Math.abs(rect.width - scale * expected.width) < 1
      && Math.abs(rect.height - scale * expected.height) < 1;
  }, reference)).toBe(true);
}

for (const key of ["payment", "privacy-policy"]) {
  test(`${key} hero saves focal points, clears and retains the library asset`, async ({ page }) => {
    let heroFixtureUrl: string | undefined;
    await page.route("**/*", route => {
      if (heroFixtureUrl && route.request().url() === heroFixtureUrl && route.request().resourceType() === "image") {
        return route.fulfill({ status: 200, contentType: "image/svg+xml", body: HERO_IMAGE_FIXTURE });
      }
      const url = new URL(route.request().url());
      if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return route.continue();
      return route.abort();
    });
    await page.goto(`/pages/editor/?key=${key}`);
    await page.getByLabel("Логин").fill(config.adminLogin);
    await page.getByLabel("Пароль").fill(config.adminPassword);
    await page.getByRole("button", { name: "Войти", exact: true }).click();
    const field = page.getByRole("group", { name: "Изображение шапки", exact: true });
    await expect(field).toBeVisible();
    const original = await rpc<PageRecord>(page, "getPage", key);
    if (!original.savedDraft) throw new Error(`An existing saved E2E draft is required for ${key}`);
    const assets = await rpc<Asset[]>(page, "listAssets");
    const asset = assets.find(a => ["image/jpeg", "image/png", "image/webp"].includes(a.mimeType)
      && a.dataUrl && !a.replacementPending && assets.filter(other => other.name === a.name).length === 1);
    if (!asset) throw new Error("An existing uniquely named gallery image is required in the isolated E2E database");
    const mediaPath = asset.dataUrl.trim().replace(/^\/api\/media\/file\//, "/media/");
    heroFixtureUrl = new URL(mediaPath, config.publicSiteUrl).href;
    if (new URL(heroFixtureUrl).protocol === "data:") {
      throw new Error("The isolated CMS E2E media fixture must use a URL-backed library asset");
    }
    let lastOwnedDraft: Draft | undefined;
    let draggedMobilePoint: Point | undefined;
    try {
      if (original.draft.hero.image) await field.getByRole("button", { name: "Убрать фото" }).click();
      await (await libraryItem(page, field, asset)).click();
      const heroImage = field.locator("[data-page-hero-preview] img");
      await expect.poll(() => heroImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 200 && image.naturalHeight === 800)).toBe(true);
      for (const mode of modes) {
        await page.setViewportSize(contract.referenceViewports[mode.key]);
        await field.getByRole("button", { name: mode.label, exact: true }).click();
        await verifyFrame(field, key, mode.key);
        await field.getByRole("button", { name: `Положение изображения (${mode.key})` }).press(mode.arrow);
        await expect(field.locator("[data-page-hero-preview] img")).toHaveCSS("object-position", mode.position);
      }
      await page.setViewportSize(contract.referenceViewports.mobile);
      await field.getByRole("button", { name: "Мобильный", exact: true }).click();
      const drag = field.getByRole("button", { name: "Положение изображения (mobile)" });
      const metrics = await heroImage.evaluate((image: HTMLImageElement) => {
        const frame = image.parentElement!.getBoundingClientRect();
        const imageRatio = image.naturalWidth / image.naturalHeight;
        return { x: frame.x, y: frame.y, width: frame.width, height: frame.height, imageRatio, frameRatio: frame.width / frame.height };
      });
      const overflowsX = metrics.imageRatio > metrics.frameRatio;
      const overflowsY = metrics.imageRatio < metrics.frameRatio;
      if (!overflowsX && !overflowsY) throw new Error("The decoded E2E image has no overflowing axis in the mobile Hero frame");
      const beforeDrag = await heroImage.evaluate((image: HTMLImageElement) => getComputedStyle(image).objectPosition);
      const deltaX = overflowsX ? 28 : 0;
      const deltaY = overflowsY ? 28 : 0;
      await drag.scrollIntoViewIfNeeded();
      const dragBox = await drag.boundingBox();
      if (!dragBox) throw new Error("The mobile Hero image drag surface is not visible");
      const startX = dragBox.x + dragBox.width / 2;
      const startY = dragBox.y + dragBox.height / 2;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 4 });
      await page.mouse.up();
      await expect.poll(() => heroImage.evaluate((image: HTMLImageElement) => getComputedStyle(image).objectPosition)).not.toBe(beforeDrag);
      const draggedPosition = await heroImage.evaluate((image: HTMLImageElement) => getComputedStyle(image).objectPosition);
      const [draggedX, draggedY] = draggedPosition.split(/\s+/).map(value => Number.parseFloat(value) / 100);
      draggedMobilePoint = { x: draggedX, y: draggedY };
      lastOwnedDraft = await save(page, key);
      await reloadSavedPage(page);
      const saved = await rpc<PageRecord>(page, "getPage", key);
      expect(saved.savedDraft).toEqual(lastOwnedDraft);
      expect(saved.savedDraft?.hero.image?.assetId).toBe(asset.id);
      for (const mode of modes) {
        await field.getByRole("button", { name: mode.label, exact: true }).click();
        const expectedPoint = mode.key === "mobile" ? draggedMobilePoint : mode.point;
        if (!expectedPoint) throw new Error("The native mobile drag did not produce a saved focal point");
        await expect.poll(async () => {
          const position = await heroImage.evaluate((image: HTMLImageElement) => getComputedStyle(image).objectPosition);
          const [x, y] = position.split(/\s+/).map(value => Number.parseFloat(value) / 100);
          return Math.abs(x - expectedPoint.x) < 0.0001 && Math.abs(y - expectedPoint.y) < 0.0001;
        }).toBe(true);
        const savedPoint = saved.savedDraft?.hero.image?.focalByViewport?.[mode.key];
        expect(savedPoint).toBeDefined();
        expect(Math.abs(savedPoint!.x - expectedPoint.x)).toBeLessThan(0.0001);
        expect(Math.abs(savedPoint!.y - expectedPoint.y)).toBeLessThan(0.0001);
      }
      await field.getByRole("button", { name: "Убрать фото" }).click();
      lastOwnedDraft = await save(page, key);
      await reloadSavedPage(page);
      await expect(field.locator("[data-page-hero-preview]")).toHaveCount(0);
      const cleared = await rpc<PageRecord>(page, "getPage", key);
      expect(cleared.savedDraft).not.toBeNull();
      expect(cleared.savedDraft).toEqual(lastOwnedDraft);
      expect(cleared.savedDraft!.hero.image ?? null).toBeNull();
      const beforeClear = structuredClone(saved.savedDraft!);
      const afterClear = structuredClone(cleared.savedDraft!);
      delete beforeClear.hero.image;
      delete afterClear.hero.image;
      expect(afterClear).toEqual(beforeClear);
      expect(cleared.publishedSnapshot).toEqual(original.publishedSnapshot);
      await expect(await libraryItem(page, field, asset)).toBeVisible();
      expect((await rpc<Asset[]>(page, "listAssets")).some(item => item.id === asset.id)).toBe(true);
    } finally {
      if (lastOwnedDraft) {
        await restoreOwnedDraft(original.savedDraft, lastOwnedDraft,
          async () => (await rpc<PageRecord>(page, "getPage", key)).savedDraft,
          async (draft, expected) => { await rpc(page, "savePage", key, draft, expected); },
        );
        const restored = await rpc<PageRecord>(page, "getPage", key);
        expect(restored.savedDraft).toEqual(original.savedDraft);
        expect(restored.publishedSnapshot).toEqual(original.publishedSnapshot);
      }
    }
  });
}
