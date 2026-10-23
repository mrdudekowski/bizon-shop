import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import type { HomePageDraft } from "../../backend-app/src/admin/domain/types";
import type { ArticleDraft } from "../../backend-app/src/admin/domain/types";
import type { ShopProductDraft } from "../../backend-app/src/admin/domain/types";
import type { StubPageDraft } from "../../backend-app/src/admin/domain/types";
import type { TireModelDraft } from "../../backend-app/src/admin/domain/types";
import {
  createCmsMediaPublicBuildEnv,
  loadCmsMediaE2EEnvironment,
  readCmsMediaE2EConfig,
} from "../../scripts/e2e/cms-media/environment";
import { preserveCmsMediaBuildOutput } from "../../scripts/e2e/cms-media/outputBackup";

const root = process.cwd();
const config = readCmsMediaE2EConfig(loadCmsMediaE2EEnvironment(root));
const validPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==",
  "base64",
);
const validPdf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
const approvedTireBenefitCopy = [
  { key: "handling", title: "Управляемость", description: "Шина помогает сохранять устойчивость и точность управления." },
  { key: "safety", title: "Безопасность", description: "Помогает сохранять контроль над автомобилем в движении." },
  { key: "high-mileage", title: "Высокий пробег", description: "Шина рассчитана на длительный срок службы." },
  { key: "economy", title: "Экономичность", description: "Шина помогает снизить расход топлива." },
  { key: "wet-grip", title: "Сцепление на мокрой дороге", description: "Помогает сохранять контроль над автомобилем во время дождя." },
  { key: "anti-wear", title: "Износостойкость", description: "Материалы и рисунок протектора помогают замедлить износ." },
  { key: "anti-tear", title: "Стойкость к разрывам", description: "Помогает сохранять целостность шины при нагрузках." },
  { key: "short-braking-distance", title: "Короткий тормозной путь", description: "Рисунок протектора способствует эффективному торможению." },
  { key: "low-noise", title: "Низкий уровень шума", description: "Снижает шум во время движения и делает поездку комфортнее." },
  { key: "heavy-load", title: "Высокая грузоподъёмность", description: "Надёжная работа при перевозке тяжёлых грузов." },
  { key: "self-cleaning", title: "Самоочищение", description: "Рисунок протектора помогает шине очищаться от загрязнений во время движения." },
  { key: "retreadability", title: "Восстанавливаемость", description: "Каркас шины подходит для восстановления протектора при соблюдении технологии." },
  { key: "stone-ejection", title: "Удаление камней", description: "Канавки протектора помогают выводить камни и защищают шину от повреждений." },
  { key: "low-rolling-resistance", title: "Низкое сопротивление качению", description: "Шина тратит меньше энергии на качение." },
  { key: "heat-dissipation", title: "Теплоотвод", description: "Отводит излишнее тепло и помогает шине работать стабильно." },
  { key: "cut-resistance", title: "Стойкость к порезам", description: "Протектор помогает защитить шину от порезов и сколов." },
  { key: "puncture-resistance", title: "Стойкость к проколам", description: "Помогает избежать проколов и сохранить шину в рабочем состоянии." },
] as const;

type AdminPage = {
  id: string;
  draft: HomePageDraft;
  savedDraft: HomePageDraft | null;
  publishedSnapshot: HomePageDraft | null;
  hidden: boolean;
};

type MediaAsset = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  usedBy: string[];
  usages?: { id: string; placementKey: string; state: string }[];
  replacementPending?: boolean;
};

type StubAdminPage = {
  id: string;
  draft: StubPageDraft;
  savedDraft: StubPageDraft | null;
  publishedSnapshot: StubPageDraft | null;
  hidden: boolean;
};

async function adminCall<T>(request: APIRequestContext, method: string, args: unknown[] = []): Promise<T> {
  const response = await request.post(`${config.apiUrl}/v1/admin`, { data: { method, args }, timeout: 15_000 });
  const body = await response.json() as { ok?: boolean; result?: T; code?: string };
  if (!response.ok() || !body.ok) {
    throw new Error(`Local CMS API ${method} failed with HTTP ${response.status()}${body.code ? ` (${body.code})` : ""}`);
  }
  return body.result as T;
}

async function loginToLocalCms(page: Page) {
  await page.goto("/pages/editor/?key=home&tab=kampaniya-magazina", { waitUntil: "domcontentloaded" });
  const heading = page.getByRole("heading", { name: "Вход в CMS" });
  // A fresh Playwright context has no existing auth cookie. Wait for the
  // shell's initial session check to finish before reading the login screen.
  await expect(heading).toBeVisible();
  await page.getByLabel("Логин").fill(config.adminLogin);
  await page.getByLabel("Пароль").fill(config.adminPassword);
  const loginResponse = page.waitForResponse((response) =>
    response.url() === `${config.apiUrl}/v1/admin/auth/login` && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  const response = await loginResponse;
  const body = await response.json().catch(() => ({})) as { ok?: boolean; code?: string; result?: { role?: string } };
  if (!response.ok() || body.ok !== true) {
    throw new Error(`Local test account login failed with HTTP ${response.status()}${body.code ? ` (${body.code})` : ""}`);
  }
  const sessionCheck = await page.evaluate(async (apiUrl) => {
    const sessionResponse = await fetch(`${apiUrl}/v1/admin/auth/session`, { credentials: "include" });
    const session = await sessionResponse.json() as { ok?: boolean; code?: string };
    return { status: sessionResponse.status, ok: session.ok, code: session.code };
  }, config.apiUrl);
  if (!sessionCheck.ok) {
    throw new Error(`Local CMS session was not retained after login: HTTP ${sessionCheck.status}${sessionCheck.code ? ` (${sessionCheck.code})` : ""}; login role=${body.result?.role ?? "unknown"}`);
  }
  await expect(page.getByText("Картинка кампании", { exact: true })).toBeVisible();
}

async function installLocalOnlyNetworkFence(page: Page, suppressCmsWarmup = false) {
  const blockedExternalOrigins = new Set<string>();
  const isolatedExternalImageOrigins = new Set<string>();
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (
      suppressCmsWarmup
      && url.origin === new URL(config.cmsUrl).origin
      && route.request().resourceType() === "fetch"
      && url.pathname !== "/pages/editor/"
    ) {
      await route.abort("blockedbyclient");
      return;
    }
    if ((url.protocol === "http:" || url.protocol === "https:") && !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
      if (url.origin === "https://s3.twcstorage.ru" && route.request().resourceType() === "image") {
        isolatedExternalImageOrigins.add(url.origin);
        await route.fulfill({ status: 200, contentType: "image/png", body: validPng });
        return;
      }
      blockedExternalOrigins.add(url.origin);
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });
  return { blockedExternalOrigins, isolatedExternalImageOrigins };
}

async function runPublicBuild(): Promise<void> {
  const result = spawnSync(
    process.execPath,
    [path.join(root, "scripts", "buildWithContentRevision.js")],
    {
      cwd: root,
      env: createCmsMediaPublicBuildEnv(loadCmsMediaE2EEnvironment(root), config),
      encoding: "utf8",
      timeout: 240_000,
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  if (result.error || result.status !== 0) {
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim().slice(-5000);
    throw new Error(`Local public-site build failed${result.error ? `: ${result.error.message}` : ` (exit ${result.status})`}${output ? `\n${output}` : ""}`);
  }
}

test("CMS rejects missing and invalid sessions and logout revokes the browser session", async ({ page }) => {
  const { blockedExternalOrigins } = await installLocalOnlyNetworkFence(page);
  const sessionUrl = `${config.apiUrl}/v1/admin/auth/session`;
  const unauthenticated = await page.context().request.get(sessionUrl);
  expect(unauthenticated.status()).toBe(401);
  await expect(unauthenticated.json()).resolves.toMatchObject({ ok: false, code: "unauthorized" });

  const invalidSession = await page.context().request.get(sessionUrl, {
    headers: { cookie: "bizon-cms-session=invalid-cms-media-e2e-token" },
  });
  expect(invalidSession.status()).toBe(401);
  await expect(invalidSession.json()).resolves.toMatchObject({ ok: false, code: "unauthorized" });

  await loginToLocalCms(page);
  await page.getByRole("button", { name: "Выйти", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Вход в CMS" })).toBeVisible();
  const afterLogout = await page.context().request.get(sessionUrl);
  expect(afterLogout.status()).toBe(401);
  await expect(afterLogout.json()).resolves.toMatchObject({ ok: false, code: "unauthorized" });
  expect([...blockedExternalOrigins]).toEqual([]);
});

test("tire model photo and approved benefits survive CMS editing, publication, and public API read", async ({ page }) => {
  test.setTimeout(120_000);
  await installLocalOnlyNetworkFence(page);
  await loginToLocalCms(page);
  const request = page.context().request;
  const runId = String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8);
  const modelName = "CMS E2E benefits " + runId;
  const assetName = "cms-media-e2e-tire-model-" + runId + ".png";
  let modelId: string | null = null;
  let assetId: string | null = null;
  let operationError: unknown;

  try {
    const interruptedRuns = await adminCall<Array<{ id: string; name: string; status: string }>>(request, "listTireModels");
    for (const prior of interruptedRuns.filter((item) => item.name.startsWith("CMS E2E benefits "))) {
      if (prior.status === "on_site" || prior.status === "published") await adminCall(request, "hideTireModel", [prior.id]);
      await adminCall(request, "deleteTireModel", [prior.id]);
    }
    const interruptedAssets = await adminCall<MediaAsset[]>(request, "listAssets");
    for (const prior of interruptedAssets.filter((asset) => asset.name.startsWith("cms-media-e2e-tire-model-"))) {
      if (prior.usedBy.length > 0) throw new Error("An interrupted tire-model E2E image is still referenced after its fixture was removed");
      await adminCall(request, "deleteAsset", [prior.id]);
    }
    const directions = await adminCall<Array<{ id: string; slug: string; status: string }>>(request, "listTireDirections");
    const direction = directions.find((item) => item.status === "on_site" || item.status === "published");
    if (!direction) throw new Error("E2E database has no published tire direction for the benefit-copy contract");
    const created = await adminCall<{ id: string; draft: TireModelDraft; savedDraft: TireModelDraft | null }>(
      request,
      "createTireModel",
      [{ name: modelName, directionId: direction.id }],
    );
    modelId = created.id;
    const fixture: TireModelDraft = {
      ...created.draft,
      slug: "cms-e2e-benefits-" + runId,
      sizes: [{
        id: "size-" + runId,
        size: "12.00R20",
        priceOnRequest: true,
        available: true,
      }],
      advantages: [],
      features: approvedTireBenefitCopy.map((benefit) => ({
        id: "model-feature-" + benefit.key + "-" + runId,
        key: benefit.key,
        title: benefit.title,
        description: benefit.description,
      })),
    };
    await adminCall(request, "saveTireModel", [modelId, fixture, created.savedDraft]);

    await page.goto(config.cmsUrl + "/tires/editor/?id=" + encodeURIComponent(modelId), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: modelName, exact: true })).toBeVisible();
    await page.getByRole("tab", { name: /^Фото/ }).click();
    const upload = page.waitForResponse((response) =>
      response.url().includes(`${config.apiUrl}/v1/admin/assets`)
      && ["POST", "PUT"].includes(response.request().method()),
    );
    await page.getByLabel("Главное фото: файл").setInputFiles({ name: assetName, mimeType: "image/png", buffer: validPng });
    const uploadResponse = await upload;
    expect(uploadResponse.status()).toBe(200);
    const uploadBody = await uploadResponse.json() as { result?: { id?: string } };
    assetId = uploadBody.result?.id ?? null;
    expect(assetId).toBeTruthy();
    const photoPreview = page.getByRole("img", { name: "Главное фото" });
    await expect(photoPreview).toBeVisible();
    await expect.poll(() => photoPreview.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(1);
    await page.getByRole("tab", { name: "Преимущества", exact: true }).click();
    for (const benefit of approvedTireBenefitCopy) {
      const item = page.locator(".advantageItem").filter({ hasText: benefit.title });
      await expect(item.getByLabel("Заголовок", { exact: true })).toHaveValue(benefit.title);
      await expect(item.locator("textarea")).toHaveValue(benefit.description);
    }
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(page.getByText("Черновик сохранён", { exact: true })).toBeVisible();

    const saved = await adminCall<{ savedDraft: TireModelDraft }>(request, "getTireModel", [modelId]);
    expect(saved.savedDraft.features).toEqual(fixture.features);
    expect(saved.savedDraft.mainImage?.assetId).toBe(assetId);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("tab", { name: /^Фото/ }).click();
    const restoredPreview = page.getByRole("img", { name: "Главное фото" });
    await expect(restoredPreview).toBeVisible();
    await expect.poll(() => restoredPreview.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(1);
    await page.getByRole("button", { name: "Опубликовать", exact: true }).click();
    await expect(page.getByText("Опубликовано в CMS.", { exact: true })).toBeVisible();

    const published = await adminCall<{ publishedSnapshot: TireModelDraft }>(request, "getTireModel", [modelId]);
    expect(published.publishedSnapshot.features).toEqual(fixture.features);
    const publicResponse = await request.get(
      `${config.apiUrl}/v1/tires/models/${encodeURIComponent(direction.slug)}/${encodeURIComponent(fixture.slug)}`,
    );
    expect(publicResponse.status()).toBe(200);
    const publicModel = await publicResponse.json() as {
      advantages: Array<{ key: string; title: string; description: string }>;
      imageUrl?: string | null;
    };
    expect(publicModel.advantages).toEqual(approvedTireBenefitCopy.map(({ key, title, description }) => ({ key, title, description })));
    const assets = await adminCall<MediaAsset[]>(request, "listAssets");
    const uploadedAsset = assets.find((asset) => asset.id === assetId);
    expect(uploadedAsset).toMatchObject({ name: assetName, mimeType: "image/png" });
    expect(publicModel.imageUrl).toBe(uploadedAsset?.dataUrl);
    expect(uploadedAsset?.usages?.some((usage) => usage.placementKey === "tire-model.main" && usage.state === "published-visible")).toBe(true);
    const storedImage = await request.get(publicModel.imageUrl!);
    expect(storedImage.status()).toBe(200);
    expect(Buffer.from(await storedImage.body())).toEqual(validPng);

    const current = await adminCall<{ savedDraft: TireModelDraft; publishedSnapshot: TireModelDraft }>(request, "getTireModel", [modelId]);
    const galleryDraft = {
      ...current.savedDraft,
      gallery: [...current.savedDraft.gallery, { ...current.savedDraft.mainImage! }],
    };
    await adminCall(request, "saveTireModel", [modelId, galleryDraft, current.savedDraft]);
    await adminCall(request, "publishTireModel", [modelId]);
    const sharedAsset = (await adminCall<MediaAsset[]>(request, "listAssets")).find((asset) => asset.id === assetId)!;
    const publishedMain = sharedAsset.usages?.find((usage) => usage.placementKey === "tire-model.main" && usage.state === "published-visible");
    const publishedGallery = sharedAsset.usages?.find((usage) => usage.placementKey === "tire-model.gallery" && usage.state === "published-visible");
    expect(publishedMain).toBeTruthy();
    expect(publishedGallery).toBeTruthy();

    await page.goto(config.cmsUrl + "/media/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Файлы", exact: true })).toBeVisible();
    const topLevelFilter = page.getByLabel("Страница / раздел");
    const nestedPageFilter = page.getByLabel("Вложенная страница");
    const placementFilter = page.getByLabel("Раздел / место");
    await topLevelFilter.selectOption("catalog");
    await expect(nestedPageFilter.locator("option").filter({ hasText: "Шины" })).toHaveCount(1);
    await nestedPageFilter.selectOption("tires");
    await expect(placementFilter.locator("option").filter({ hasText: "Модель шины → основное фото" })).toHaveCount(1);
    await placementFilter.selectOption("tire-model.main");
    const mediaCard = page.locator("li").filter({ hasText: assetName });
    await expect(mediaCard).toHaveCount(1);
    const mainUsage = mediaCard.locator("li").filter({ hasText: "Модель шины → основное фото" });
    await expect(mainUsage).toContainText("Показывается");
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
    page.once("dialog", (dialog) => void dialog.accept());
    await mainUsage.getByRole("button", { name: "Отвязать", exact: true }).click();
    await expect(mainUsage).toHaveCount(0);

    const afterDetach = (await adminCall<MediaAsset[]>(request, "listAssets")).find((asset) => asset.id === assetId)!;
    expect(afterDetach.usages?.some((usage) => usage.id === publishedMain!.id)).toBe(false);
    expect(afterDetach.usages?.some((usage) => usage.id === publishedGallery!.id && usage.state === "published-visible")).toBe(true);
    const publicAfterDetach = await request.get(
      `${config.apiUrl}/v1/tires/models/${encodeURIComponent(direction.slug)}/${encodeURIComponent(fixture.slug)}`,
    );
    const detachedPublicModel = await publicAfterDetach.json() as { imageUrl?: string | null; gallery?: string[] };
    expect(detachedPublicModel.imageUrl).toBeNull();
    expect(detachedPublicModel.gallery).toContain(uploadedAsset?.dataUrl);
  } catch (error) {
    operationError = error;
    throw error;
  } finally {
    try {
      if (modelId) {
        const current = await adminCall<{ publishedSnapshot: TireModelDraft | null }>(request, "getTireModel", [modelId]);
        if (current.publishedSnapshot != null) await adminCall(request, "hideTireModel", [modelId]);
        await adminCall(request, "deleteTireModel", [modelId]);
        modelId = null;
      }
      if (assetId) {
        await adminCall(request, "deleteAsset", [assetId]);
        const remainingAssets = await adminCall<MediaAsset[]>(request, "listAssets");
        expect(remainingAssets.some((asset) => asset.id === assetId)).toBe(false);
        assetId = null;
      }
    } catch (cleanupError) {
      if (!operationError) throw cleanupError;
      console.error("Tire benefit-copy E2E cleanup failed after a test error:", cleanupError instanceof Error ? cleanupError.message : "unknown cleanup error");
    }
  }
});

test("Shop variant media survives CMS save, publish, API reload, and public read", async ({ page }) => {
  test.setTimeout(120_000);
  await installLocalOnlyNetworkFence(page);
  await loginToLocalCms(page);
  const request = page.context().request;
  const runId = String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8);
  const name = "CMS E2E variant " + runId;
  const slug = "cms-e2e-variant-" + runId;
  let productId: string | null = null;
  let draftProductId: string | null = null;
  let published = false;
  let variantAsset: MediaAsset | undefined;
  let mainAsset: MediaAsset | undefined;
  let failure: unknown;

  try {
    const interruptedRuns = await adminCall<Array<{ id: string; name: string; isPublished: boolean }>>(request, "listShopProducts");
    for (const prior of interruptedRuns.filter((item) => item.name.startsWith("CMS E2E variant "))) {
      if (prior.isPublished) await adminCall(request, "hideShopProduct", [prior.id]);
      await adminCall(request, "deleteShopProduct", [prior.id]);
    }
    const categories = await adminCall<Array<{ id: string; publishedSnapshot: unknown; hidden: boolean }>>(request, "listShopCategories");
    const category = categories.find((item) => item.publishedSnapshot != null && !item.hidden);
    if (!category) throw new Error("E2E database has no published Shop category for the variant-media contract");
    const unused = (await adminCall<MediaAsset[]>(request, "listAssets"))
      .filter((item) => item.mimeType.startsWith("image/") && item.usedBy.length === 0);
    variantAsset = unused[0];
    mainAsset = unused[1];
    expect(variantAsset).toBeTruthy();
    expect(mainAsset).toBeTruthy();

    const created = await adminCall<{ id: string; draft: ShopProductDraft; savedDraft: ShopProductDraft | null }>(
      request,
      "createShopProduct",
      [{ name, categoryId: category.id }],
    );
    productId = created.id;
    const productDraft: ShopProductDraft = {
      ...created.draft,
      slug,
      price: 2000,
      priceOnRequest: false,
      mainImage: {
        assetId: mainAsset!.id,
        alt: "Обложка E2E товара",
        focalX: 0.5,
        focalY: 0.5,
        crop: { x: 0, y: 0, width: 1, height: 1 },
      },
      variants: [{
        id: "variant-" + runId,
        color: "Красный",
        size: "M",
        configuration: "Long range",
        sku: "SKU-" + runId,
        price: 1800,
        priceOnRequest: false,
        available: true,
      }, {
        id: "variant-blue-" + runId,
        color: "Синий",
        size: "M",
        configuration: "Standard",
        sku: "SKU-BLUE-" + runId,
        priceOnRequest: true,
        available: true,
      }],
    };
    await adminCall(request, "saveShopProduct", [productId, productDraft, created.savedDraft]);

    await page.goto(config.cmsUrl + "/shop/product-editor/?id=" + encodeURIComponent(productId), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    await page.getByLabel("Цена до скидки", { exact: true }).fill("2500");
    await page.getByRole("tab", { name: "Варианты", exact: true }).click();
    const variantField = page.locator("fieldset").filter({ has: page.getByText("Фото варианта 1", { exact: true }) });
    await variantField.getByLabel("Комплектация", { exact: true }).fill("Long range");
    await variantField.getByLabel("Цена до скидки варианта 1").fill("2200");
    await variantField.getByRole("button", { name: "Выбрать из галереи", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "Выбрать изображение" });
    await picker.getByLabel("Поиск по имени").fill(variantAsset!.name);
    await picker.getByRole("button", { name: "Выбрать " + variantAsset!.name, exact: true }).click();
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(page.getByText("Черновик сохранён", { exact: true })).toBeVisible();

    const saved = await adminCall<{ savedDraft: ShopProductDraft }>(request, "getShopProduct", [productId]);
    expect(saved.savedDraft.oldPrice).toBe(2500);
    expect(saved.savedDraft.variants[0]?.oldPrice).toBe(2200);
    expect(saved.savedDraft.variants[0]?.configuration).toBe("Long range");
    expect(saved.savedDraft.variants[1]?.configuration).toBe("Standard");
    expect(saved.savedDraft.variants[0]?.image).toMatchObject({ assetId: variantAsset!.id, alt: "" });
    const afterSaveAssets = await adminCall<MediaAsset[]>(request, "listAssets");
    expect(afterSaveAssets.find((item) => item.id === variantAsset!.id)?.usedBy.some((use) => use.includes("Черновик: shop-products"))).toBe(true);

    await page.getByRole("button", { name: "Опубликовать", exact: true }).click();
    await expect(page.getByText("Опубликовано в CMS.", { exact: true })).toBeVisible();
    published = true;
    const reread = await adminCall<{ publishedSnapshot: ShopProductDraft }>(request, "getShopProduct", [productId]);
    expect(reread.publishedSnapshot.oldPrice).toBe(2500);
    expect(reread.publishedSnapshot.variants[0]?.oldPrice).toBe(2200);
    expect(reread.publishedSnapshot.variants[0]?.configuration).toBe("Long range");
    expect(reread.publishedSnapshot.variants[1]?.configuration).toBe("Standard");
    expect(reread.publishedSnapshot.variants[0]?.image).toMatchObject({
      assetId: variantAsset!.id,
      focalX: 0.5,
      focalY: 0.5,
      crop: { x: 0, y: 0, width: 1, height: 1 },
    });
    const afterPublishAssets = await adminCall<MediaAsset[]>(request, "listAssets");
    expect(afterPublishAssets.find((item) => item.id === variantAsset!.id)?.usages).toEqual(expect.arrayContaining([
      expect.objectContaining({ placementKey: "product.variant", state: "published-visible" }),
    ]));

    const publicResponse = await request.get(config.apiUrl + "/v1/shop/products/" + encodeURIComponent(slug));
    expect(publicResponse.status()).toBe(200);
    const publicProduct = await publicResponse.json() as { price?: number; oldPrice?: number; variants?: Array<{ color?: string; configuration?: string; price?: number; oldPrice?: number; images?: string[] }> };
    expect(publicProduct).toMatchObject({ price: 2000, oldPrice: 2500 });
    expect(publicProduct.variants?.find((variant) => variant.color === "Красный")).toMatchObject({
      color: "Красный",
      configuration: "Long range",
      price: 1800,
      oldPrice: 2200,
      images: [variantAsset!.dataUrl],
    });
    expect(publicProduct.variants?.find((variant) => variant.color === "Синий")).toMatchObject({
      color: "Синий",
      configuration: "Standard",
    });

    const draftOnly = await adminCall<{ id: string; draft: ShopProductDraft; savedDraft: ShopProductDraft | null }>(
      request,
      "createShopProduct",
      [{ name: name + " draft cleanup", categoryId: category.id }],
    );
    draftProductId = draftOnly.id;
    const draftPlacement = {
      assetId: variantAsset!.id,
      alt: "Черновое фото варианта",
      focalX: 0.5,
      focalY: 0.5,
      crop: { x: 0, y: 0, width: 1, height: 1 },
    };
    await adminCall(request, "saveShopProduct", [draftProductId, {
      ...draftOnly.draft,
      slug: slug + "-draft-cleanup",
      priceOnRequest: true,
      mainImage: { ...draftPlacement, assetId: mainAsset!.id },
      variants: [{
        id: "variant-draft-" + runId,
        color: "Синий",
        size: "S",
        sku: "SKU-DRAFT-" + runId,
        priceOnRequest: true,
        available: true,
        image: draftPlacement,
      }],
    }, draftOnly.savedDraft]);
    await adminCall(request, "deleteShopProduct", [draftProductId]);
    draftProductId = null;
    const afterDraftDelete = await adminCall<MediaAsset[]>(request, "listAssets");
    expect(afterDraftDelete.find((item) => item.id === variantAsset!.id)?.usedBy.some((use) => use.includes("Черновик: shop-products"))).toBe(false);
    expect(afterDraftDelete.find((item) => item.id === mainAsset!.id)?.usedBy.some((use) => use.includes("Черновик: shop-products"))).toBe(false);
  } catch (error) {
    failure = error;
    throw error;
  } finally {
    try {
      if (draftProductId) await adminCall(request, "deleteShopProduct", [draftProductId]);
      if (productId) {
        if (published) await adminCall(request, "hideShopProduct", [productId]);
        await adminCall(request, "deleteShopProduct", [productId]);
      }
      const afterCleanup = await adminCall<MediaAsset[]>(request, "listAssets");
      if (variantAsset) expect(afterCleanup.find((item) => item.id === variantAsset!.id)?.usedBy).toEqual([]);
      if (mainAsset) expect(afterCleanup.find((item) => item.id === mainAsset!.id)?.usedBy).toEqual([]);
    } catch (cleanupError) {
      if (!failure) throw cleanupError;
      console.error("Shop variant media E2E cleanup failed after a test error:", cleanupError instanceof Error ? cleanupError.message : "unknown cleanup error");
    }
  }
});

test("Tire IQ cover selection and explicit removal survive CMS save, publish, and public API read", async ({ page }) => {
  test.setTimeout(120_000);
  await installLocalOnlyNetworkFence(page);
  await loginToLocalCms(page);
  const request = page.context().request;
  const runId = String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8);
  const title = "CMS E2E article " + runId;
  const slug = "cms-e2e-article-" + runId;
  let articleId: string | null = null;
  let asset: MediaAsset | undefined;
  let mutationStarted = false;
  let operationError: unknown;

  try {
    const interrupted = await adminCall<Array<{ id: string; title: string }>>(request, "listMaterials");
    for (const prior of interrupted.filter((item) => item.title.startsWith("CMS E2E article "))) {
      await adminCall(request, "unpublishDocument", ["material", prior.id]);
      await adminCall(request, "deleteMaterial", [prior.id]);
    }
    asset = (await adminCall<MediaAsset[]>(request, "listAssets"))
      .find((item) => item.mimeType.startsWith("image/") && item.usedBy.length === 0);
    expect(asset).toBeTruthy();

    const created = await adminCall<{ id: string; draft: ArticleDraft; savedDraft: ArticleDraft | null }>(
      request,
      "createMaterial",
      [{ title, kind: "article" }],
    );
    articleId = created.id;
    const initialDraft: ArticleDraft = {
      ...created.draft,
      slug,
      excerpt: "E2E cover intent check",
      body: "CMS and public article cover synchronization check.",
      imageConfigured: false,
    };
    await adminCall(request, "saveMaterial", [articleId, initialDraft, created.savedDraft]);
    mutationStarted = true;

    await page.goto(config.cmsUrl + "/materials/editor/?id=" + encodeURIComponent(articleId), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Выбрать из галереи", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "Выбрать изображение" });
    await picker.getByLabel("Поиск по имени").fill(asset!.name);
    await picker.getByRole("button", { name: "Выбрать " + asset!.name, exact: true }).click();
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(page.getByText("Черновик сохранён", { exact: true })).toBeVisible();
    let reread = await adminCall<{ savedDraft: ArticleDraft }>(request, "getMaterial", [articleId]);
    expect(reread.savedDraft).toMatchObject({ imageConfigured: true, image: { assetId: asset!.id } });

    await page.getByRole("button", { name: "Опубликовать", exact: true }).click();
    await expect(page.getByText("Опубликовано в CMS.", { exact: true })).toBeVisible();
    let publicArticle = await request.get(`${config.apiUrl}/v1/articles/${encodeURIComponent(slug)}`);
    expect(publicArticle.status()).toBe(200);
    await expect(publicArticle.json()).resolves.toMatchObject({ imageUrl: asset!.dataUrl, imageConfigured: true });

    await page.getByRole("button", { name: "Убрать фото", exact: true }).click();
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(page.getByText("Черновик сохранён", { exact: true })).toBeVisible();
    reread = await adminCall<{ savedDraft: ArticleDraft }>(request, "getMaterial", [articleId]);
    expect(reread.savedDraft.image).toBeNull();
    expect(reread.savedDraft.imageConfigured).toBe(true);
    await page.getByRole("button", { name: "Опубликовать", exact: true }).click();
    await expect(page.getByText("Опубликовано в CMS.", { exact: true })).toBeVisible();
    publicArticle = await request.get(`${config.apiUrl}/v1/articles/${encodeURIComponent(slug)}`);
    await expect(publicArticle.json()).resolves.toMatchObject({ imageUrl: null, imageConfigured: true });

    await page.getByRole("button", { name: "Использовать системную обложку", exact: true }).click();
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(page.getByText("Черновик сохранён", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Опубликовать", exact: true }).click();
    await expect(page.getByText("Опубликовано в CMS.", { exact: true })).toBeVisible();
    publicArticle = await request.get(`${config.apiUrl}/v1/articles/${encodeURIComponent(slug)}`);
    await expect(publicArticle.json()).resolves.toMatchObject({ imageUrl: null, imageConfigured: false });
  } catch (error) {
    operationError = error;
    throw error;
  } finally {
    try {
      if (articleId) {
        await adminCall(request, "unpublishDocument", ["material", articleId]);
        await adminCall(request, "deleteMaterial", [articleId]);
        articleId = null;
      }
      if (asset && mutationStarted) {
        const assets = await adminCall<MediaAsset[]>(request, "listAssets");
        expect(assets.find((item) => item.id === asset!.id)?.usedBy.some((use) => use.includes(title))).toBe(false);
      }
    } catch (cleanupError) {
      if (!operationError) throw cleanupError;
      console.error("Tire IQ article E2E cleanup failed after a test error:", cleanupError instanceof Error ? cleanupError.message : "unknown error");
    }
  }
});

test("Wheel type copy and cover survive CMS save, publish, and public API read", async ({ page }) => {
  test.setTimeout(90_000);
  await installLocalOnlyNetworkFence(page);
  await loginToLocalCms(page);
  const request = page.context().request;
  const runId = String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8);
  const name = "CMS E2E wheel type " + runId;
  const assetName = "wheel-type-" + runId + ".png";
  let typeId: string | null = null;
  let assetId: string | null = null;
  let published = false;
  let testFailed = false;

  try {
    const created = await adminCall<{ id: string }>(request, "createWheelType", [{ name }]);
    typeId = created.id;
    await page.goto(config.cmsUrl + "/wheels/types/editor?id=" + encodeURIComponent(typeId), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    await page.getByLabel("Короткое описание").fill("Короткое описание E2E");

    const upload = page.waitForResponse((response) =>
      response.url().includes(`${config.apiUrl}/v1/admin/assets`)
      && ["POST", "PUT"].includes(response.request().method()),
    );
    await page.getByLabel("Главное фото: файл").setInputFiles({ name: assetName, mimeType: "image/png", buffer: validPng });
    const uploadResponse = await upload;
    expect(uploadResponse.status()).toBe(200);
    const uploadBody = await uploadResponse.json() as { result?: { id?: string } };
    assetId = uploadBody.result?.id ?? null;
    expect(assetId).toBeTruthy();

    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(page.getByText("Черновик сохранён", { exact: true })).toBeVisible();
    const saved = await adminCall<{ savedDraft: { shortDescription?: string; mainImage?: { assetId: string } } }>(request, "getWheelType", [typeId]);
    expect(saved.savedDraft).toMatchObject({
      shortDescription: "Короткое описание E2E",
      mainImage: { assetId },
    });

    await page.getByRole("button", { name: "Опубликовать", exact: true }).click();
    await expect(page.getByText("Опубликовано в CMS.", { exact: true })).toBeVisible();
    published = true;
    const snapshot = await adminCall<{ publishedSnapshot: { slug?: string; shortDescription?: string; mainImage?: { assetId: string } } }>(request, "getWheelType", [typeId]);
    expect(snapshot.publishedSnapshot).toMatchObject(saved.savedDraft);

    const publicType = snapshot.publishedSnapshot;
    expect(publicType.slug).toBeTruthy();
    const publicResponse = await request.get(config.apiUrl + "/v1/wheels/types/" + encodeURIComponent(publicType.slug!));
    expect(publicResponse.status()).toBe(200);
    await expect(publicResponse).toBeOK();
    const publicPayload = await publicResponse.json() as { shortDescription?: string; imageUrl?: string | null };
    expect(publicPayload.shortDescription).toBe("Короткое описание E2E");
    const assets = await adminCall<MediaAsset[]>(request, "listAssets");
    const publishedAsset = assets.find((asset) => asset.id === assetId);
    expect(publicPayload.imageUrl).toBe(publishedAsset?.dataUrl);
    expect(publishedAsset?.usages).toEqual(expect.arrayContaining([
      expect.objectContaining({ placementKey: "wheel-type.cover", state: "published-visible" }),
    ]));
    const publicImage = await request.get(publicPayload.imageUrl!);
    expect(publicImage.status()).toBe(200);
    expect(Buffer.from(await publicImage.body())).toEqual(validPng);
  } catch (error) {
    testFailed = true;
    throw error;
  } finally {
    if (typeId) {
      try {
        if (published) {
          const hidden = await adminCall<{ hidden: boolean }>(request, "hideWheelType", [typeId]);
          if (!hidden.hidden) throw new Error(`hideWheelType did not archive published fixture ${typeId}`);
        }
        await adminCall(request, "deleteWheelType", [typeId]);
        const remainingTypes = await adminCall<Array<{ id: string }>>(request, "listWheelTypes");
        expect(remainingTypes.some((item) => item.id === typeId)).toBe(false);
      } catch (cleanupError) {
        if (!testFailed) throw cleanupError;
        console.error("Wheel type E2E cleanup failed after the primary test error:", cleanupError instanceof Error ? cleanupError.message : "unknown cleanup error");
      }
    }
    if (assetId) {
      try {
        await adminCall(request, "deleteAsset", [assetId]);
        const remainingAssets = await adminCall<MediaAsset[]>(request, "listAssets");
        expect(remainingAssets.some((asset) => asset.id === assetId)).toBe(false);
      } catch (cleanupError) {
        if (!testFailed) throw cleanupError;
        console.error("Wheel type media cleanup failed after the primary test error:", cleanupError instanceof Error ? cleanupError.message : "unknown cleanup error");
      }
    }
  }
});

test("Legal page PDF survives CMS upload, save, publish, public API, and S3 read", async ({ page }) => {
  test.setTimeout(90_000);
  await installLocalOnlyNetworkFence(page);
  await loginToLocalCms(page);
  const request = page.context().request;
  const runId = String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8);
  const documentTitle = "Правила E2E " + runId;
  const fileName = "cms-legal-e2e-" + runId + ".pdf";
  let pageKey: StubPageDraft["id"] | null = null;
  let originalPage: StubAdminPage | null = null;
  let assetId: string | null = null;
  let pageMutationStarted = false;
  let testFailed = false;

  try {
    const pages = await adminCall<StubAdminPage[]>(request, "listPages");
    originalPage = pages.find((candidate) =>
      ["privacy-policy", "warranty", "shop-delivery-returns"].includes(candidate.id)
      && candidate.publishedSnapshot != null
      && !candidate.hidden
      && JSON.stringify(candidate.savedDraft) === JSON.stringify(candidate.publishedSnapshot),
    ) ?? null;
    test.skip(originalPage == null, "E2E seed needs a published legal page without an unsaved draft");
    pageKey = originalPage!.id as StubPageDraft["id"];
    const saved = await adminCall<StubAdminPage>(request, "getPage", [pageKey]);
    expect(saved.publishedSnapshot).not.toBeNull();
    expect(saved.savedDraft).toEqual(saved.publishedSnapshot);

    await page.goto(config.cmsUrl + "/pages/editor/?key=" + encodeURIComponent(pageKey), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const uploadResponsePromise = page.waitForResponse((response) =>
      response.url().includes(`${config.apiUrl}/v1/admin/assets`)
      && response.request().method() === "POST",
    );
    await page.getByLabel("Загрузить PDF", { exact: true }).setInputFiles({
      name: fileName,
      mimeType: "application/pdf",
      buffer: validPdf,
    });
    const uploadResponse = await uploadResponsePromise;
    expect(uploadResponse.status()).toBe(200);
    const uploadBody = await uploadResponse.json() as { result?: { id?: string } };
    assetId = uploadBody.result?.id ?? null;
    expect(assetId).toBeTruthy();
    await page.getByLabel("Название документа", { exact: true }).fill(documentTitle);
    await page.getByRole("button", { name: "Добавить раздел", exact: true }).click();
    const sectionHeading = "CMS section " + runId;
    const sectionBody = "Editorial content survives the complete publication path.";
    const addedSection = page.getByRole("group", { name: /^Раздел \d+$/ }).last();
    const addedHeading = addedSection.getByLabel("Заголовок раздела", { exact: true });
    const addedBody = addedSection.getByLabel("Текст раздела", { exact: true });
    await expect(addedHeading).toHaveValue("");
    await expect(addedBody).toHaveValue("");
    await addedHeading.fill(sectionHeading);
    await addedBody.fill(sectionBody);
    pageMutationStarted = true;
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(page.getByText("Черновик сохранён", { exact: true })).toBeVisible();

    const savedPage = await adminCall<StubAdminPage>(request, "getPage", [pageKey]);
    expect(savedPage.savedDraft?.documents).toEqual([{ assetId, title: documentTitle }]);
    expect(savedPage.savedDraft?.sections).toEqual([expect.objectContaining({ heading: sectionHeading, body: sectionBody })]);
    await page.getByRole("button", { name: "Опубликовать", exact: true }).click();
    await expect(page.getByText("Опубликовано в CMS.", { exact: true })).toBeVisible();

    const publishedPage = await adminCall<StubAdminPage>(request, "getPage", [pageKey]);
    expect(publishedPage.publishedSnapshot?.documents).toEqual(savedPage.savedDraft?.documents);
    const publicResponse = await request.get(`${config.apiUrl}/v1/pages/${encodeURIComponent(pageKey)}`);
    expect(publicResponse.status()).toBe(200);
    const publicPage = await publicResponse.json() as { documents?: Array<{ url: string; title: string }>; sections?: Array<{ heading: string; body: string }> };
    expect(publicPage.documents).toHaveLength(1);
    expect(publicPage.documents?.[0]?.title).toBe(documentTitle);
    expect(publicPage.sections).toEqual([expect.objectContaining({ heading: sectionHeading, body: sectionBody })]);
    const pdfResponse = await request.get(publicPage.documents![0]!.url);
    expect(pdfResponse.status()).toBe(200);
    expect(pdfResponse.headers()["content-type"]).toContain("application/pdf");
    expect(Buffer.from(await pdfResponse.body())).toEqual(validPdf);
  } catch (error) {
    testFailed = true;
    throw error;
  } finally {
    if (pageMutationStarted && pageKey && originalPage?.publishedSnapshot) {
      try {
        const latestPage = await adminCall<StubAdminPage>(request, "getPage", [pageKey]);
        await adminCall(request, "savePage", [pageKey, originalPage.publishedSnapshot, latestPage.savedDraft]);
        await adminCall(request, "publishPage", [pageKey]);
        const restored = await adminCall<StubAdminPage>(request, "getPage", [pageKey]);
        expect(restored.publishedSnapshot).toEqual(originalPage.publishedSnapshot);
        expect(restored.savedDraft).toEqual(originalPage.savedDraft);
      } catch (cleanupError) {
        if (!testFailed) throw cleanupError;
        console.error("Legal page E2E restore failed after a test error:", cleanupError instanceof Error ? cleanupError.message : "unknown error");
      }
    }
    if (assetId) {
      try {
        const assets = await adminCall<MediaAsset[]>(request, "listAssets");
        const asset = assets.find((item) => item.id === assetId);
        expect(asset?.usedBy).not.toContain(`Документ страницы: ${pageKey}`);
        await adminCall(request, "deleteAsset", [assetId]);
        const afterDelete = await adminCall<MediaAsset[]>(request, "listAssets");
        expect(afterDelete.some((item) => item.id === assetId)).toBe(false);
      } catch (cleanupError) {
        if (!testFailed) throw cleanupError;
        console.error("Legal page PDF cleanup failed after a test error:", cleanupError instanceof Error ? cleanupError.message : "unknown error");
      }
    }
  }
});

test("Wheel variant specs survive CMS save, publish, admin reload, and public read", async ({ page }) => {
  test.setTimeout(90_000);
  await installLocalOnlyNetworkFence(page);
  await loginToLocalCms(page);
  const request = page.context().request;
  const runId = String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8);
  const name = "CMS E2E wheel " + runId;
  let modelId: string | null = null;
  let documentAssetId: string | null = null;
  let published = false;
  let testFailed = false;

  try {
    const interruptedRuns = await adminCall<Array<{ id: string; name: string; status: string }>>(request, "listWheelModels");
    for (const prior of interruptedRuns.filter((item) => item.name.startsWith("CMS E2E wheel "))) {
      if (prior.status === "on_site") {
        const hidden = await adminCall<{ hidden: boolean }>(request, "hideWheelModel", [prior.id]);
        if (!hidden.hidden) throw new Error(`E2E cleanup could not archive interrupted wheel model ${prior.id}`);
      }
      await adminCall(request, "deleteWheelModel", [prior.id]);
    }
    const interruptedPdfs = await adminCall<MediaAsset[]>(request, "listAssets");
    for (const prior of interruptedPdfs.filter((item) => item.name.startsWith("wheel-passport-"))) {
      await adminCall(request, "deleteAsset", [prior.id]);
    }
    const wheelTypes = await adminCall<Array<{ id: string; publishedSnapshot: unknown; hidden: boolean }>>(request, "listWheelTypes");
    const wheelType = wheelTypes.find((item) => item.publishedSnapshot != null && !item.hidden);
    if (!wheelType) throw new Error("E2E database has no published wheel type for the variant-spec contract");
    const created = await adminCall<{ id: string }>(request, "createWheelModel", [{ name, wheelTypeId: wheelType.id }]);
    modelId = created.id;

    await page.goto(config.cmsUrl + "/wheels/editor/?id=" + encodeURIComponent(modelId), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    await page.getByRole("tab", { name: "Варианты", exact: true }).click();
    await page.getByRole("button", { name: "Добавить вариант", exact: true }).click();
    const variantField = page.locator("fieldset").filter({ has: page.getByText("Вариант 1", { exact: true }) });
    await variantField.getByRole("textbox").nth(0).fill("22.5×8.25");
    await variantField.getByRole("textbox").nth(1).fill("Серебристый");
    await variantField.getByRole("button", { name: "Ещё", exact: true }).click();
    await variantField.getByLabel("SKU").fill("WHEEL-" + runId);
    await variantField.getByLabel("Диаметр").fill("22.5");
    await variantField.getByLabel("Ширина").fill("8.25");
    await variantField.getByLabel("Количество отверстий").fill("10");
    await variantField.getByLabel("PCD, мм").fill("335");
    await variantField.getByLabel("Допустимая нагрузка").fill("4500 кг");
    await variantField.getByLabel("Вес, кг").fill("38.5");
    await variantField.getByLabel("Покрытие").fill("Порошковая окраска");
    await variantField.getByLabel("Тип крепежа").fill("Шпилька");
    await variantField.getByLabel("Материал крепежа").fill("Сталь");
    await variantField.getByLabel("Совместимые размеры шин").fill("315/80 R22.5");
    await variantField.getByLabel("Источник спецификации").fill("Паспорт изделия");
    await page.getByLabel("Загрузить PDF").setInputFiles({
      name: "wheel-passport-" + runId + ".pdf",
      mimeType: "application/pdf",
      buffer: validPdf,
    });
    const pdfTitle = "wheel-passport-" + runId + ".pdf";
    await expect(page.getByLabel("Название документа")).toHaveValue(pdfTitle);
    const uploadedAssets = await adminCall<MediaAsset[]>(request, "listAssets");
    documentAssetId = uploadedAssets.find((item) => item.name === pdfTitle)?.id ?? null;
    expect(documentAssetId).toBeTruthy();
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(page.getByText("Черновик сохранён", { exact: true })).toBeVisible();

    const saved = await adminCall<{ savedDraft: { variants: Array<Record<string, unknown>>; documents: Array<{ assetId: string; title: string }> } }>(request, "getWheelModel", [modelId]);
    expect(saved.savedDraft.documents).toHaveLength(1);
    expect(saved.savedDraft.documents[0]).toMatchObject({ title: pdfTitle });
    documentAssetId = saved.savedDraft.documents[0]!.assetId;
    const linkedAssets = await adminCall<MediaAsset[]>(request, "listAssets");
    expect(linkedAssets.find((item) => item.id === documentAssetId)?.usedBy).toContain(`Черновик: wheel-models / ${modelId}`);
    expect(saved.savedDraft.variants[0]).toMatchObject({
      sku: "WHEEL-" + runId,
      diameter: 22.5,
      width: 8.25,
      boltHoles: 10,
      pcdMm: 335,
      loadRating: "4500 кг",
      weight: 38.5,
      finish: "Порошковая окраска",
      fastenerType: "Шпилька",
      fastenerMaterial: "Сталь",
      compatibleTireSizes: "315/80 R22.5",
      sourceSpecification: "Паспорт изделия",
    });

    await page.getByRole("button", { name: "Опубликовать", exact: true }).click();
    await expect(page.getByText("Опубликовано в CMS.", { exact: true })).toBeVisible();
    published = true;
    const reread = await adminCall<{ publishedSnapshot: { variants: Array<Record<string, unknown>>; documents: Array<{ assetId: string; title: string }> } }>(request, "getWheelModel", [modelId]);
    expect(reread.publishedSnapshot.documents).toEqual(saved.savedDraft.documents);
    const publishedAssets = await adminCall<MediaAsset[]>(request, "listAssets");
    expect(publishedAssets.find((item) => item.id === documentAssetId)?.usages).toEqual(expect.arrayContaining([
      expect.objectContaining({ placementKey: "documents.wheel-model", state: "published-visible" }),
    ]));
    const savedVariantFields = Object.fromEntries(
      Object.entries(saved.savedDraft.variants[0]!).filter(([key]) => key !== "id"),
    );
    expect(reread.publishedSnapshot.variants[0]).toMatchObject(savedVariantFields);

    const wheelTypeData = wheelType.publishedSnapshot as { slug: string };
    const publicResponse = await request.get(config.apiUrl + "/v1/wheels/types/" + encodeURIComponent(wheelTypeData.slug) + "/variants");
    expect(publicResponse.status()).toBe(200);
    const publicVariants = await publicResponse.json() as Array<Record<string, unknown>>;
    expect(publicVariants.find((item) => item.sku === "WHEEL-" + runId)).toMatchObject({
      diameter: 22.5,
      width: 8.25,
      boltHoles: 10,
      pcdMm: 335,
      loadRating: "4500 кг",
      finish: "Порошковая окраска",
      fastenerType: "Шпилька",
      fastenerMaterial: "Сталь",
      compatibleTireSizes: "315/80 R22.5",
      sourceSpecification: "Паспорт изделия",
    });
    const publicModelsResponse = await request.get(config.apiUrl + "/v1/wheels/types/" + encodeURIComponent(wheelTypeData.slug) + "/models");
    expect(publicModelsResponse.status()).toBe(200);
    const publicModels = await publicModelsResponse.json() as Array<{ slug: string; documents?: Array<{ url: string; title: string }> }>;
    const publicModel = publicModels.find((item) => item.slug === "cms-e2e-wheel-" + runId);
    expect(publicModel?.documents).toHaveLength(1);
    expect(publicModel?.documents?.[0]?.title).toBe(pdfTitle);
    const pdfResponse = await request.get(publicModel!.documents![0]!.url);
    expect(pdfResponse.status()).toBe(200);
    expect(Buffer.from(await pdfResponse.body())).toEqual(validPdf);
  } catch (error) {
    testFailed = true;
    throw error;
  } finally {
    if (modelId) {
      try {
        if (published) {
          const hidden = await adminCall<{ hidden: boolean }>(request, "hideWheelModel", [modelId]);
          if (!hidden.hidden) throw new Error(`hideWheelModel did not mark published fixture ${modelId} as hidden`);
        }
        await adminCall(request, "deleteWheelModel", [modelId]);
      } catch (cleanupError) {
        if (!testFailed) throw cleanupError;
        console.error("Wheel variant E2E cleanup failed after the primary test error:", cleanupError instanceof Error ? cleanupError.message : "unknown cleanup error");
      }
    }
    if (documentAssetId) {
      try {
        await adminCall(request, "deleteAsset", [documentAssetId]);
        if (!testFailed) {
          const remainingAssets = await adminCall<MediaAsset[]>(request, "listAssets");
          expect(remainingAssets.some((item) => item.id === documentAssetId)).toBe(false);
        }
      } catch (cleanupError) {
        if (!testFailed) throw cleanupError;
        console.error("Wheel PDF E2E cleanup failed after the primary test error:", cleanupError instanceof Error ? cleanupError.message : "unknown cleanup error");
      }
    }
  }
});

test("CMS media survives upload, gallery selection, save, publish, and public static build", async ({ page }) => {
  const { blockedExternalOrigins, isolatedExternalImageOrigins } = await installLocalOnlyNetworkFence(page, true);

  const request = page.context().request;
  let originalPage: AdminPage | null = null;
  let asset: MediaAsset | null = null;
  let pageMutationStarted = false;
  let publishedForBuild = false;
  let restorePublicOutput: (() => Promise<void>) | null = null;
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const validName = `cms-media-e2e-${runId}.png`;
  const invalidName = `cms-media-e2e-invalid-${runId}.png`;
  const campaign = page.getByLabel("Картинка кампании: файл").locator("xpath=ancestor::fieldset");
  let operationError: unknown;

  try {
    await loginToLocalCms(page);

    // Recover only artifacts clearly created by an interrupted run of this test.
    const recoveryPage = await adminCall<AdminPage>(request, "getPage", ["home"]);
    let recoveryAssets = await adminCall<MediaAsset[]>(request, "listAssets");
    let priorTestAssets = recoveryAssets.filter((item) => item.name.startsWith("cms-media-e2e-"));
    for (const priorReplacement of priorTestAssets.filter((item) => item.replacementPending)) {
      await adminCall(request, "cancelAssetReplacement", [priorReplacement.id]);
    }
    if (priorTestAssets.some((item) => item.replacementPending)) {
      recoveryAssets = await adminCall<MediaAsset[]>(request, "listAssets");
      priorTestAssets = recoveryAssets.filter((item) => item.name.startsWith("cms-media-e2e-"));
    }
    const priorTestIds = new Set(priorTestAssets.map((item) => item.id));
    const referencesPriorTestAsset = (snapshot: HomePageDraft | null | undefined) =>
      priorTestIds.has(String(snapshot?.shopCampaign?.image?.assetId ?? ""));
    const publishedE2EAsset = referencesPriorTestAsset(recoveryPage.publishedSnapshot);
    if (publishedE2EAsset || referencesPriorTestAsset(recoveryPage.savedDraft)) {
      if (!recoveryPage.publishedSnapshot) throw new Error("Cannot recover an interrupted E2E draft without a published baseline");
      const recoverySnapshot = publishedE2EAsset
        ? {
          ...recoveryPage.publishedSnapshot,
          shopCampaign: { ...recoveryPage.publishedSnapshot.shopCampaign, image: null },
        }
        : recoveryPage.publishedSnapshot;
      await adminCall(request, "savePage", ["home", recoverySnapshot, recoveryPage.savedDraft]);
      await adminCall(request, "publishPage", ["home"]);
    }
    const assetsAfterRecovery = await adminCall<MediaAsset[]>(request, "listAssets");
    for (const priorAsset of priorTestAssets) {
      const recoveredAsset = assetsAfterRecovery.find((item) => item.id === priorAsset.id);
      if (recoveredAsset?.usedBy.length) throw new Error("A previous E2E media asset remains in use outside its expected draft");
      await adminCall(request, "deleteAsset", [priorAsset.id]);
    }

    // Recovery happens through the API after the editor first loaded. Refresh so
    // the UI and the clean DB baseline describe the same page version.
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText("Картинка кампании", { exact: true })).toBeVisible();

    originalPage = await adminCall<AdminPage>(request, "getPage", ["home"]);
    expect(originalPage.id).toBe("home");
    expect(originalPage.hidden).toBe(false);
    expect(originalPage.publishedSnapshot).not.toBeNull();
    expect(originalPage.savedDraft).toEqual(originalPage.publishedSnapshot);
    const originalCampaignImage = originalPage.publishedSnapshot?.shopCampaign?.image ?? null;
    if (originalCampaignImage) {
      await expect(campaign.getByRole("button", { name: "Убрать фото", exact: true })).toBeVisible();
      const originalPreview = campaign.locator("img");
      await expect(originalPreview).toBeVisible();
      await expect(originalPreview).toHaveAttribute("alt", originalCampaignImage.alt);
      await expect.poll(() => originalPreview.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    } else {
      await expect(campaign.getByRole("button", { name: "Убрать фото", exact: true })).toHaveCount(0);
      await expect(campaign.locator("img")).toHaveCount(0);
    }
    if (originalCampaignImage) {
      // Keep the E2E upload on the create path. Uploading while an image is
      // selected intentionally stages a replacement of that shared media ID.
      await campaign.getByRole("button", { name: "Убрать фото", exact: true }).click();
      await expect(campaign.locator("img")).toHaveCount(0);
    }

    const invalidUpload = page.waitForResponse((response) =>
      response.url().includes(`${config.apiUrl}/v1/admin/assets`)
      && ["POST", "PUT"].includes(response.request().method()),
    );
    await page.getByLabel("Картинка кампании: файл").setInputFiles({
      name: invalidName,
      mimeType: "image/png",
      buffer: validPng.subarray(0, 16),
    });
    expect((await invalidUpload).status()).toBe(400);
    await expect(page.locator('p[role="alert"]')).toContainText("Файл не подошёл");
    const afterInvalidUpload = await adminCall<MediaAsset[]>(request, "listAssets");
    expect(afterInvalidUpload.some((item) => item.name === invalidName)).toBe(false);

    const validUpload = page.waitForResponse((response) =>
      response.url().includes(`${config.apiUrl}/v1/admin/assets`)
      && ["POST", "PUT"].includes(response.request().method()),
    );
    await page.getByLabel("Картинка кампании: файл").setInputFiles({
      name: validName,
      mimeType: "image/png",
      buffer: validPng,
    });
    const uploadResponse = await validUpload;
    expect(uploadResponse.status()).toBe(200);
    const uploadBody = await uploadResponse.json() as { ok?: boolean; result?: { id?: string } };
    expect(uploadBody.ok).toBe(true);
    expect(uploadBody.result?.id).toBeTruthy();
    const uploadedId = String(uploadBody.result?.id);

    const uploadedAssets = await adminCall<MediaAsset[]>(request, "listAssets");
    asset = uploadedAssets.find((item) => item.id === uploadedId) ?? null;
    expect(asset).not.toBeNull();
    expect(asset).toMatchObject({ id: uploadedId, name: validName, mimeType: "image/png", usedBy: [] });
    expect(new URL(asset!.dataUrl).origin).toBe(new URL(config.s3Endpoint).origin);
    const storedImage = await request.get(asset!.dataUrl, { maxRedirects: 0 });
    expect(storedImage.status()).toBe(200);
    expect(storedImage.headers()["content-type"]).toContain("image/png");
    expect(Buffer.from(await storedImage.body())).toEqual(validPng);

    await campaign.getByRole("button", { name: "Убрать фото", exact: true }).click();
    await campaign.getByRole("button", { name: "Выбрать из галереи", exact: true }).click();
    const gallery = page.getByRole("dialog", { name: "Выбрать изображение" });
    await gallery.getByLabel("Поиск по имени").fill(validName);
    await expect(gallery.getByRole("button", { name: `Выбрать ${validName}`, exact: true })).toBeVisible();
    await gallery.getByRole("button", { name: "Закрыть галерею", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Выбрать изображение" })).toHaveCount(0);
    await expect(campaign.getByRole("img", { name: "Картинка кампании" })).toHaveCount(0);

    await campaign.getByRole("button", { name: "Выбрать из галереи", exact: true }).click();
    const reopenedGallery = page.getByRole("dialog", { name: "Выбрать изображение" });
    await reopenedGallery.getByLabel("Поиск по имени").fill(validName);
    await reopenedGallery.getByRole("button", { name: `Выбрать ${validName}`, exact: true }).click();
    const campaignImage = campaign.getByRole("img", { name: "Картинка кампании" });
    await expect(campaignImage).toBeVisible();
    await expect.poll(() => campaignImage.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(1);

    pageMutationStarted = true;
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(page.getByText("Черновик сохранён", { exact: true })).toBeVisible();
    let savedPage = await adminCall<AdminPage>(request, "getPage", ["home"]);
    expect(savedPage.savedDraft?.shopCampaign?.image?.assetId).toBe(uploadedId);

    const browser = page.context().browser();
    if (!browser) throw new Error("Cannot create an isolated browser context for CMS persistence verification");
    const freshContext = await browser.newContext({ baseURL: config.cmsUrl });
    try {
      const freshPage = await freshContext.newPage();
      await installLocalOnlyNetworkFence(freshPage);
      await loginToLocalCms(freshPage);
      const freshPreview = freshPage.getByLabel("Картинка кампании: файл").locator("xpath=ancestor::fieldset").getByRole("img", { name: "Картинка кампании" });
      await expect(freshPreview).toBeVisible();
      await expect.poll(() => freshPreview.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(1);
    } finally {
      await freshContext.close();
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Картинка кампании: файл")).toBeVisible();
    const restoredPreview = page.getByLabel("Картинка кампании: файл").locator("xpath=ancestor::fieldset").getByRole("img", { name: "Картинка кампании" });
    await expect(restoredPreview).toBeVisible();
    await expect.poll(() => restoredPreview.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(1);
    savedPage = await adminCall<AdminPage>(request, "getPage", ["home"]);
    expect(savedPage.savedDraft?.shopCampaign?.image?.assetId).toBe(uploadedId);

    await page.getByRole("button", { name: "Опубликовать", exact: true }).click();
    await expect(page.getByText("Опубликовано в CMS.", { exact: true })).toBeVisible();
    const publishedPage = await adminCall<AdminPage>(request, "getPage", ["home"]);
    expect(publishedPage.publishedSnapshot?.shopCampaign?.image?.assetId).toBe(uploadedId);
    const snapshotResponse = await request.get(`${config.apiUrl}/v1/content/snapshot`);
    expect(snapshotResponse.status()).toBe(200);
    const publicSnapshot = await snapshotResponse.json() as { revision?: string };
    expect(JSON.stringify(publicSnapshot)).toContain(asset!.dataUrl);

    restorePublicOutput = await preserveCmsMediaBuildOutput(root);
    publishedForBuild = true;
    await runPublicBuild();
    const outputDirectory = path.join(root, "out");
    const manifest = JSON.parse(await readFile(path.join(outputDirectory, "media-manifest.json"), "utf8")) as {
      revision: string;
      files: Array<{ sourceUrl: string; path: string; mimeType: string; byteSize: number; sha256: string }>;
    };
    const contentSnapshot = JSON.parse(await readFile(path.join(outputDirectory, "content-snapshot.json"), "utf8")) as { revision: string };
    const file = manifest.files.find((entry) => entry.sourceUrl === asset!.dataUrl);
    expect(manifest.revision).toBe(contentSnapshot.revision);
    expect(contentSnapshot.revision).toBe(publicSnapshot.revision);
    expect(file).toMatchObject({
      mimeType: "image/png",
      byteSize: validPng.length,
      sha256: createHash("sha256").update(validPng).digest("hex"),
    });
    const publicImagePath = path.resolve(outputDirectory, `.${file!.path}`);
    expect(publicImagePath.startsWith(`${path.resolve(outputDirectory)}${path.sep}`)).toBe(true);
    expect(Buffer.from(await readFile(publicImagePath))).toEqual(validPng);
    expect(await readFile(path.join(outputDirectory, "index.html"), "utf8")).toContain(file!.path);

    await campaign.getByRole("button", { name: "Убрать фото", exact: true }).click();
    await page.getByRole("button", { name: "Сохранить", exact: true }).click();
    await expect(page.getByText("Черновик сохранён", { exact: true })).toBeVisible();
    const clearedDraft = await adminCall<AdminPage>(request, "getPage", ["home"]);
    expect(clearedDraft.savedDraft?.shopCampaign?.image ?? null).toBeNull();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Картинка кампании: файл")).toBeVisible();
    await expect(campaign.getByRole("button", { name: "Убрать фото", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Опубликовать", exact: true }).click();
    await expect(page.getByText("Опубликовано в CMS.", { exact: true })).toBeVisible();
    const clearedPublished = await adminCall<AdminPage>(request, "getPage", ["home"]);
    expect(clearedPublished.publishedSnapshot?.shopCampaign?.image ?? null).toBeNull();

    expect([...blockedExternalOrigins]).toEqual([]);
    expect([...isolatedExternalImageOrigins].every((origin) => origin === "https://s3.twcstorage.ru")).toBe(true);
  } catch (error) {
    operationError = error;
    throw error;
  } finally {
    try {
      if (originalPage && pageMutationStarted) {
        const latestPage = await adminCall<AdminPage>(request, "getPage", ["home"]);
        const baselineSnapshot = {
          ...originalPage.publishedSnapshot!,
          shopCampaign: {
            ...originalPage.publishedSnapshot!.shopCampaign,
            image: originalPage.publishedSnapshot!.shopCampaign.image ?? null,
          },
        };
        await adminCall(request, "savePage", ["home", baselineSnapshot, latestPage.savedDraft]);
        const restoredDraft = await adminCall<AdminPage>(request, "getPage", ["home"]);
        const expectedCampaignAsset = originalPage.publishedSnapshot?.shopCampaign?.image?.assetId ?? null;
        const savedCampaignAsset = restoredDraft.savedDraft?.shopCampaign?.image?.assetId ?? null;
        console.log(`CMS media E2E cleanup draft check: expected=${expectedCampaignAsset ?? "none"}, saved=${savedCampaignAsset ?? "none"}`);
        await adminCall(request, "publishPage", ["home"]);
        const restoredPage = await adminCall<AdminPage>(request, "getPage", ["home"]);
        const restoredCampaignAsset = restoredPage.publishedSnapshot?.shopCampaign?.image?.assetId ?? null;
        console.log(`CMS media E2E cleanup page check: expected=${expectedCampaignAsset ?? "none"}, restored=${restoredCampaignAsset ?? "none"}`);
        expect(restoredCampaignAsset).toBe(expectedCampaignAsset);
      }
      if (asset) {
        const remainingAssets = await adminCall<MediaAsset[]>(request, "listAssets");
        const remaining = remainingAssets.find((item) => item.id === asset!.id);
        if (remaining?.usedBy.length === 0) await adminCall(request, "deleteAsset", [asset.id]);
        const afterCleanup = await adminCall<MediaAsset[]>(request, "listAssets");
        expect(afterCleanup.some((item) => item.id === asset!.id)).toBe(false);
      }
      if (publishedForBuild) {
        if (!restorePublicOutput) throw new Error("CMS media E2E public output backup is missing");
        const restore = restorePublicOutput;
        await restore();
        restorePublicOutput = null;
        const restoredManifestPath = path.join(root, "out", "media-manifest.json");
        try {
          const baselineManifest = JSON.parse(await readFile(restoredManifestPath, "utf8")) as { files: Array<{ sourceUrl: string }> };
          expect(baselineManifest.files.some((entry) => entry.sourceUrl === asset?.dataUrl)).toBe(false);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      }
    } catch (cleanupError) {
      if (!operationError) throw cleanupError;
      console.error("CMS media E2E cleanup failed after a test error:", cleanupError instanceof Error ? cleanupError.message : "unknown cleanup error");
    } finally {
      if (restorePublicOutput) {
        const restore = restorePublicOutput;
        restorePublicOutput = null;
        await restore();
      }
    }
  }
});
