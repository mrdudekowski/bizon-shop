# Админка BIZON, первая поставка

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** На ветке `frontend-cms` открыть localhost-админку: оболочка, локальный клиент с контрактом будущего API, список и документ модели шины.

**Architecture:** Ветка `frontend-cms` — отдельный корень, не потомок `main-app`. В дереве только админка. Экраны вызывают только `AdminClient`. Сейчас его выполняет `createLocalAdminClient` и хранит состояние в `localStorage`. Публикация копирует сохранённый черновик в снимок и не трогает `main-app`.

**Tech Stack:** Next.js 15.4.11, React 19, TypeScript 5.8, Vitest 4. Стили — CSS-модули, без новой зависимости.

**Spec:** `docs/superpowers/specs/2026-09-25-frontend-cms-design.md`

## Global Constraints

- Payload не подключать. Базу и `backend-app` не вызывать.
- Экраны не читают `localStorage` напрямую.
- Связи только по стабильным `id`.
- Роли: `admin` | `editor`. Редактор не видит публикацию, скрытие, удаление и пункт «Пользователи».
- Localhost открывается сразу как `admin`. Переключатель роли вызывает `getSession` / `setSessionRole`.
- Пароль в локальный адаптер не записывается.
- Slug после первой публикации заморожен. Удаление только у ни разу не опубликованного черновика.
- Публикация модели шины блокируется без названия, slug, направления, главного фото, читаемого размера или выбора цены. Пустой SKU не блокирует. Повтор slug или размера блокирует.
- Фокус и кадр живут на месте использования картинки, не на файле.
- Техника, условия и оси — только значения из списков ниже, новые не создаются.
- Этот план не делает диски, shop, страницы, статьи, экран медиатеки и экран пользователей. Для них остаются пустые пункты навигации.

Списки подбора, копировать как есть:

```ts
export const VEHICLE_TYPE_OPTIONS = [
  { label: "Магистральный тягач", value: "long-haul-tractor" },
  { label: "Региональный грузовик", value: "regional-truck" },
  { label: "Строительный самосвал", value: "construction-dumper" },
  { label: "Карьерная или специальная техника", value: "quarry-special" },
] as const;

export const OPERATING_CONDITION_OPTIONS = [
  { label: "Магистраль", value: "long-haul" },
  { label: "Региональные маршруты", value: "regional" },
  { label: "Смешанный цикл", value: "mixed" },
  { label: "Карьер и бездорожье", value: "off-road" },
] as const;

export const AXLE_OPTIONS = [
  { label: "Рулевая", value: "steer" },
  { label: "Ведущая", value: "drive" },
  { label: "Прицепная", value: "trailer" },
] as const;

export const TIRE_CATEGORIES = [
  { value: "long_haul", name: "Long Haul" },
  { value: "regional", name: "Regional" },
  { value: "off_road", name: "Off-Road" },
  { value: "construction", name: "Construction" },
  { value: "urban", name: "Urban" },
] as const;
```

Коды ошибок клиента: `slug_taken`, `invalid_slug`, `publish_blocked`, `unsaved`, `media_in_use`, `cannot_disable_self`, `last_admin`.

## File structure

- `src/admin/domain/options.ts` — закрытые списки.
- `src/admin/domain/types.ts` — документы, черновик, снимок, медиа, сессия.
- `src/admin/domain/slug.ts` — slug из названия и проверка формата.
- `src/admin/domain/publishRules.ts` — блок публикации модели шины.
- `src/admin/domain/publishRules.test.ts`
- `src/admin/domain/slug.test.ts`
- `src/admin/client/errors.ts` — `AdminClientError`.
- `src/admin/client/adminClient.ts` — интерфейс `AdminClient`.
- `src/admin/client/localStore.ts` — адаптер и `localStorage`.
- `src/admin/client/localStore.test.ts`
- `src/admin/shell/AdminShell.tsx`
- `src/admin/shell/AdminShell.module.css`
- `src/admin/tires/TireModelList.tsx`
- `src/admin/tires/TireModelEditor.tsx`
- `src/admin/tires/TireDirectionList.tsx`
- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/page.tsx` — список моделей.
- `src/app/(admin)/tires/directions/page.tsx`
- `src/app/(admin)/tires/[id]/page.tsx`
- `src/app/(admin)/wheels/page.tsx`, `shop/page.tsx`, `pages/page.tsx`, `materials/page.tsx`, `media/page.tsx`, `users/page.tsx` — заглушки «раздел будет в следующей поставке».
- Публичного сайта в этой ветке нет. Его не копировать из `main-app`.

Следующий план, не этот: диски, shop, страницы, материалы, экран медиатеки, экран пользователей.

---

### Task 1: Правила публикации и slug

**Files:**
- Create: `src/admin/domain/options.ts`
- Create: `src/admin/domain/types.ts`
- Create: `src/admin/domain/slug.ts`
- Create: `src/admin/domain/publishRules.ts`
- Test: `src/admin/domain/publishRules.test.ts`
- Test: `src/admin/domain/slug.test.ts`

**Interfaces:**
- Consumes: ничего
- Produces: `slugifyTitle(title: string): string`, `isValidSlug(slug: string): boolean`, `tireModelPublishBlockers(model: TireModelDraft): PublishBlocker[]`

Тип `TireModelDraft` в `types.ts`:

```ts
export type TireSizeDraft = {
  id: string;
  size: string;
  price?: number;
  priceOnRequest: boolean;
  available: boolean;
  sku?: string;
};

export type ImagePlacement = {
  assetId: string;
  alt: string;
  focalX: number;
  focalY: number;
  crop: { x: number; y: number; width: number; height: number };
};

export type TireModelDraft = {
  id: string;
  name: string;
  slug: string;
  directionId: string;
  mainImage?: ImagePlacement;
  sizes: TireSizeDraft[];
};
```

`PublishBlocker` = `"name" | "slug" | "direction" | "mainImage" | "size" | "price" | "duplicateSize"`.

- [ ] **Step 1: Write the failing tests**

`src/admin/domain/slug.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isValidSlug, slugifyTitle } from "./slug";

describe("slugifyTitle", () => {
  it("builds a lowercase ascii slug from a russian-free title", () => {
    expect(slugifyTitle("Bizon Long Haul")).toBe("bizon-long-haul");
  });

  it("rejects an empty slug", () => {
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("ok-slug")).toBe(true);
    expect(isValidSlug("Bad Slug")).toBe(false);
  });
});
```

`src/admin/domain/publishRules.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { tireModelPublishBlockers } from "./publishRules";
import type { TireModelDraft } from "./types";

function model(patch: Partial<TireModelDraft> = {}): TireModelDraft {
  return {
    id: "m1",
    name: "LH01",
    slug: "lh01",
    directionId: "d1",
    mainImage: {
      assetId: "a1",
      alt: "",
      focalX: 0.5,
      focalY: 0.5,
      crop: { x: 0, y: 0, width: 1, height: 1 },
    },
    sizes: [{ id: "s1", size: "315/80R22.5", priceOnRequest: true, available: true }],
    ...patch,
  };
}

describe("tireModelPublishBlockers", () => {
  it("allows a card the site can render", () => {
    expect(tireModelPublishBlockers(model())).toEqual([]);
  });

  it("blocks a missing name, slug, direction, image, size, and price choice", () => {
    expect(
      tireModelPublishBlockers(
        model({
          name: " ",
          slug: "",
          directionId: "",
          mainImage: undefined,
          sizes: [{ id: "s1", size: " ", priceOnRequest: false, available: true }],
        }),
      ),
    ).toEqual(["name", "slug", "direction", "mainImage", "size", "price"]);
  });

  it("does not block a missing sku", () => {
    expect(tireModelPublishBlockers(model())).not.toContain("sku");
  });

  it("blocks a duplicate size inside the model", () => {
    expect(
      tireModelPublishBlockers(
        model({
          sizes: [
            { id: "s1", size: "315/80R22.5", priceOnRequest: true, available: true },
            { id: "s2", size: "315/80R22.5", priceOnRequest: true, available: true },
          ],
        }),
      ),
    ).toContain("duplicateSize");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/admin/domain/slug.test.ts src/admin/domain/publishRules.test.ts`

Expected: FAIL, modules not found.

- [ ] **Step 3: Write minimal implementation**

`slug.ts`: trim, lower case, replace spaces with `-`, drop characters outside `[a-z0-9-]`. Valid slug matches `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`.

`publishRules.ts`: push blockers in the order asserted above. A size is readable when `size.trim().length > 0`. Price is chosen when `priceOnRequest` is true or `typeof price === "number"`. Duplicate size compares trimmed lower-case size strings.

`options.ts` and the rest of `types.ts` (direction, asset, user, session, document status) land here so later tasks import one module. `DocumentStatus` for the list is derived later, not stored: `draft` if `publishedSnapshot` is null, `hidden` if `hidden` is true, otherwise `on_site`. Add `hasUnpublishedDraft: boolean` when the saved draft JSON differs from the snapshot.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/admin/domain/slug.test.ts src/admin/domain/publishRules.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/admin/domain
git commit -m "Add tire publish and slug rules for the admin client."
```

---

### Task 2: Локальный клиент

**Files:**
- Create: `src/admin/client/errors.ts`
- Create: `src/admin/client/adminClient.ts`
- Create: `src/admin/client/localStore.ts`
- Test: `src/admin/client/localStore.test.ts`

**Interfaces:**
- Consumes: `slugifyTitle`, `isValidSlug`, `tireModelPublishBlockers`, `TireModelDraft`
- Produces: `AdminClient`, `createLocalAdminClient(storage: AdminStorage): AdminClient`

```ts
export class AdminClientError extends Error {
  constructor(readonly code: "slug_taken" | "invalid_slug" | "publish_blocked" | "unsaved" | "media_in_use" | "cannot_disable_self" | "last_admin") {
    super(code);
  }
}

export type AdminClient = {
  getSession(): Promise<{ login: string; role: "admin" | "editor" }>;
  setSessionRole(role: "admin" | "editor"): Promise<void>;
  listTireDirections(): Promise<{ id: string; name: string; slug: string }[]>;
  createAsset(file: { name: string; mimeType: string; dataUrl: string }): Promise<{ id: string }>;
  listTireModels(): Promise<TireModelListItem[]>;
  getTireModel(id: string): Promise<TireModelRecord>;
  createTireModel(input: { name: string; directionId: string }): Promise<TireModelRecord>;
  saveTireModel(id: string, draft: TireModelDraft): Promise<TireModelRecord>;
  publishTireModel(id: string): Promise<TireModelRecord>;
  hideTireModel(id: string): Promise<TireModelRecord>;
  deleteTireModel(id: string): Promise<void>;
};
```

`TireModelRecord` holds `draft`, `savedDraft`, `publishedSnapshot`, `hidden`, `slugLocked`, `lastSavedBy`, `lastPublishedBy`. Dirty means `draft` JSON differs from `savedDraft`.

`AdminStorage` is `{ read(): string | null; write(value: string): void }` so tests pass a memory object. Browser adapter uses `localStorage` key `bizon.frontend-cms`.

- [ ] **Step 1: Write the failing tests**

Cover these cases in `localStore.test.ts` with a memory storage:

- `createTireModel` slugifies the name, starts unpublished, `slugLocked` is false.
- second model with the same slug throws `slug_taken`.
- `saveTireModel` writes `savedDraft` and does not set `publishedSnapshot`.
- `publishTireModel` throws `unsaved` when `draft` differs from `savedDraft`.
- `publishTireModel` throws `publish_blocked` when the name is empty.
- a successful publish copies `savedDraft` into `publishedSnapshot` and sets `slugLocked`.
- saving again after publish does not change `publishedSnapshot`.
- changing `slug` after publish throws `invalid_slug` and keeps the old slug.
- `deleteTireModel` throws `invalid_slug` is wrong; it throws nothing for a never-published model and removes it. For a published model `deleteTireModel` throws `publish_blocked`. Use code `publish_blocked` for “cannot delete a published document”.
- `hideTireModel` sets `hidden` and list status `hidden` while the record remains.
- storage JSON does not contain the string `"password"`.
- corrupt JSON on read is replaced by the seed and `read()` after create returns parseable state. Expose `createLocalAdminClient` reset on parse failure.

Seed: one direction `{ id: "dir-long-haul", name: "Магистральные", slug: "long-haul" }`, no models, one user `{ id: "user-admin", login: "admin", role: "admin", disabled: false }`, session role `admin`.

- [ ] **Step 2: Run the test file and confirm FAIL**

Run: `npx vitest run src/admin/client/localStore.test.ts`

- [ ] **Step 3: Implement `createLocalAdminClient`**

Ids: `crypto.randomUUID()`. Publish calls `tireModelPublishBlockers` and throws `publish_blocked` if the array is not empty. List item fields: `id`, `name`, `directionName`, `sizeCount`, `status`, `hasUnpublishedDraft`, `imageAssetId`.

- [ ] **Step 4: Run the test file and confirm PASS**

- [ ] **Step 5: Commit**

```bash
git add src/admin/client
git commit -m "Add the local admin client that later swaps for HTTP."
```

---

### Task 3: Оболочка вместо публичного сайта

**Files:**
- Create: `src/admin/shell/AdminShell.tsx`
- Create: `src/admin/shell/AdminShell.module.css`
- Create: `src/app/(admin)/layout.tsx`
- Create: `src/app/(admin)/page.tsx`
- Create: stub pages listed in the file structure
- Delete: `src/app/(site)`
- Modify: `package.json` name to `bizon_frontend_cms`, description `BIZON admin — Next.js 15 (frontend-cms branch)`

**Interfaces:**
- Consumes: `AdminClient.getSession`, `setSessionRole`
- Produces: shell with nav links `/`, `/tires/directions`, `/wheels`, `/shop`, `/pages`, `/materials`, `/media`, `/users`

- [ ] **Step 1: Confirm the tree has no public site**

`src/app/(site)` и `src/lib/content` в этой ветке отсутствуют. Не переносить их с `main-app`. В `src/admin/domain/types.ts` одна строка: публичная форма карточки совпадает с `main-app` `src/lib/content/types.ts`, но код сайта не импортируется.

- [ ] **Step 2: Render the shell**

`layout.tsx` renders `AdminShell`. Header text `BIZON`, role switch `Администратор` / `Редактор`, note `Данные локальные`. Left nav labels as in the spec. `Пользователи` only when `session.role === "admin"`. No `Заявки`. Narrow layout: nav hidden behind a button, no new dependency. CSS: every grid has `grid-template-columns`, items that can shrink use `min-width: 0`, `width: 100%` is paired with `max-width: 100%`.

Home page and stubs can be empty server components that render a heading. The tire list replaces the home page in Task 4.

- [ ] **Step 3: Run the app**

Run: `npx next dev --port 3210`

Open `http://localhost:3210`. Expected: admin shell, not the public site. Stop the server after the check.

- [ ] **Step 4: Commit**

```bash
git add package.json src/app src/admin/shell src/admin/domain/types.ts
git commit -m "Open the frontend-cms branch as the admin shell."
```

---

### Task 4: Список и документ модели шины

**Files:**
- Create: `src/admin/tires/TireModelList.tsx`
- Create: `src/admin/tires/TireModelEditor.tsx`
- Create: `src/admin/tires/TireDirectionList.tsx`
- Modify: `src/app/(admin)/page.tsx`
- Create: `src/app/(admin)/tires/directions/page.tsx`
- Create: `src/app/(admin)/tires/[id]/page.tsx`

**Interfaces:**
- Consumes: `AdminClient` methods from Task 2
- Produces: screens at `/`, `/tires/directions`, `/tires/[id]`

- [ ] **Step 1: List**

Client component. Load `listTireModels`. Row shows name, direction, size count, status `черновик` | `на сайте` | `скрыто`, and `есть черновик` when `hasUnpublishedDraft`. Search filters by name. Status filter: all / on_site / hidden. Button `Новая модель` asks name and a direction from `listTireDirections`. Creating calls `createTireModel` and routes to `/tires/[id]`.

- [ ] **Step 2: Direction list**

Read-only list of the seed direction plus a short form later is out of scope. This task shows the seed direction name and slug so the model form can select it. Creating extra directions is not in this plan.

- [ ] **Step 3: Editor**

Sections: Карточка (name, slug, direction, brand, descriptions, category, tread), Подбор (checkboxes from `options.ts`), Размеры (add/remove rows: size, price or price-on-request, available, sku), Медиа (file input reads a data URL, `createAsset` stores `{ id, name, mimeType, dataUrl }` and sets `mainImage` placement with default focal 0.5/0.5 and full crop).

Sticky bar: `Сохранить` for both roles. `Опубликовать`, `Скрыть с сайта`, `Удалить` only for `admin`. Delete only when `publishedSnapshot` is null. Publish button disabled while dirty or blockers exist. Blocker text visible to both roles. Buttons read `Сохраняем…` and `Публикуем…` while the promise is pending. Errors from `AdminClientError.code` map to Russian sentences next to the bar. Slug input disabled when `slugLocked`.

- [ ] **Step 4: Verify in the browser**

Run `npx next dev --port 3210`. Create a model, save, confirm publish stays disabled until the card is complete, publish, hide, switch to editor and confirm publish and delete are gone. Reload and confirm the model is still there.

- [ ] **Step 5: Run unit tests**

Run: `npx vitest run src/admin`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/admin src/app
git commit -m "Edit tire models against the local admin client."
```

## Self-check against the spec

Covered here: client seam, local session, draft versus snapshot, tire publish gate, slug lock, hide, delete only unpublished, role switch, shell, tire list and document, image placement crop fields, selection checkboxes, password not stored.

Not covered here, next plan: wheel and shop documents, pages, articles and stories, media library screen, users screen, direction editing beyond the seed, PDF list, advantages, menu order.
