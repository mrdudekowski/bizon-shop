# Полный фронтенд админки BIZON

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Довести экраны `frontend-cms` до контракта `docs/superpowers/specs/2026-09-25-frontend-cms-complete.md`.

**Architecture:** Экраны вызывают только `AdminClient`. Локальный адаптер хранит черновик и снимок в `localStorage`. Картинки — `ImagePlacement` на файл библиотеки.

**Tech Stack:** Next.js 15, React 19, TypeScript strict, Vitest, CSS modules. Новых зависимостей нет.

## Global Constraints

- Ветка `frontend-cms`. Код `main-app` не импортировать.
- Коды ошибок только: `slug_taken`, `invalid_slug`, `publish_blocked`, `unsaved`, `media_in_use`, `cannot_disable_self`, `last_admin`.
- Пароль не писать в хранилище.
- `preferredWheelSlugs` в черновике страницы нет.
- Фокус и кадр: числа 0..1, при сохранении кламп.
- Пустые технические поля размера, пустая галерея и пустые преимущества не блокируют публикацию.
- Сетка: `grid-template-columns` явные, `min-width: 0`, `width: 100%` вместе с `max-width: 100%`.
- Коммит разрешён этим планом. Не менять git config. Если автор неизвестен, передать `GIT_AUTHOR_NAME` и `GIT_COMMITTER_NAME` равными `Cursor Agent`, email `cursor-agent@local`.

---

### Task 1: Контракт документов и клиент

**Files:**
- Modify: `src/admin/domain/types.ts`
- Modify: `src/admin/domain/publishRules.ts`
- Modify: `src/admin/client/adminClient.ts`
- Modify: `src/admin/client/localStore.ts`
- Test: `src/admin/client/localStore.test.ts`

**Interfaces:**
- Consumes: существующие `createLocalAdminClient`, `ImagePlacement`, `PAGE_KEYS`.
- Produces: `TireDirectionDraft`, расширенные `TireSizeDraft`, `TireModelDraft`, `PageDraft` как объединение `HomePageDraft | ShopHomePageDraft | StubPageDraft`, `setUserRole(id, role)`, `storageNotice(): Promise<string | null>`.

- [ ] **Step 1: Write the failing test**

Добавить в `localStore.test.ts`:

```ts
it("publishes a tire direction only with a main image", async () => {
  const client = createLocalAdminClient(memory());
  const created = await client.createTireDirection({ name: "Регион" });
  await client.saveTireDirection(created.id, created.draft);
  await expect(client.publishTireDirection(created.id)).rejects.toMatchObject({ code: "publish_blocked" });
});

it("rejects removing the last admin role", async () => {
  const client = createLocalAdminClient(memory());
  const [admin] = await client.listUsers();
  await expect(client.setUserRole(admin.id, "editor")).rejects.toMatchObject({ code: "last_admin" });
});

it("reports a repaired store once", async () => {
  const storage = memory();
  storage.write("{");
  const client = createLocalAdminClient(storage);
  expect(await client.storageNotice()).toBe("Хранилище повреждено, восстановлены стартовые данные");
  expect(await client.storageNotice()).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/admin/client/localStore.test.ts`
Expected: FAIL, methods are missing.

- [ ] **Step 3: Write minimal implementation**

Типы по спецификации. Направление — `EntityRecord<TireDirectionDraft>`. Стартовый `dir-long-haul` оборачивается в документ с пустым `mainImage`. `load` чинит плоское направление и страницу без `hero`. `collectAssetUsage` смотрит галерею, PDF, фото вариантов и все картинки страницы. `setUserRole` кидает `last_admin`, если после смены не останется активного администратора. `storageNotice` возвращает текст один раз после починки JSON.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsc --noEmit; npx vitest run src/admin`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/admin/domain src/admin/client docs/superpowers/specs/2026-09-25-frontend-cms-complete.md docs/superpowers/plans/2026-09-25-frontend-cms-complete.md
git commit -m "Extend the admin document contract for the full CMS frontend."
```

### Task 2: Шины

**Files:**
- Create: `src/admin/media/PlacementFields.tsx`
- Modify: `src/admin/tires/TireModelList.tsx`
- Modify: `src/admin/tires/TireModelEditor.tsx`
- Modify: `src/admin/tires/TireDirectionList.tsx`
- Create: `src/admin/tires/TireDirectionEditor.tsx`
- Create: `src/app/tires/directions/[id]/page.tsx`

**Interfaces:**
- Consumes: клиент направлений и модели из Task 1, `PlacementFields` принимает `value: ImagePlacement | undefined` и `onChange`.
- Produces: документ направления и полная модель шины.

- [ ] **Step 1: Implement the screens**

Список шин: поиск по названию, фильтр статуса. Документ: технические колонки размера, галерея с порядком, преимущества, PDF, меню, фокус и кадр, кто сохранил и кто опубликовал. Направление открывается документом с техникой и условиями, без осей.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/admin/tires src/admin/media/PlacementFields.tsx src/app/tires
git commit -m "Finish tire directions and the tire model document."
```

### Task 3: Диски и shop

**Files:**
- Modify: `src/admin/wheels/WheelModelList.tsx`
- Modify: `src/admin/wheels/WheelModelEditor.tsx`
- Create: `src/admin/wheels/WheelTypeEditor.tsx`
- Create: `src/app/wheels/types/[id]/page.tsx`
- Modify: `src/admin/shop/ShopProductList.tsx`
- Modify: `src/admin/shop/ShopProductEditor.tsx`
- Create: `src/admin/shop/ShopCategoryEditor.tsx`
- Create: `src/app/shop/categories/[id]/page.tsx`

**Interfaces:**
- Consumes: `PlacementFields`, существующие методы клиента дисков и shop.

- [ ] **Step 1: Implement the documents**

Тип диска и категория shop редактируются. Модель диска получает описания, галерею, PDF, меню и поля варианта из спецификации. Товар получает галерею и у варианта свою цену и фото.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/admin/wheels src/admin/shop src/app/wheels src/app/shop
git commit -m "Finish wheel and shop documents."
```

### Task 4: Страницы, материалы, медиа, пользователи

**Files:**
- Modify: `src/admin/pages/PageEditor.tsx`
- Modify: `src/admin/pages/PageList.tsx`
- Modify: `src/admin/materials/MaterialEditor.tsx`
- Modify: `src/admin/media/MediaLibrary.tsx`
- Modify: `src/admin/users/UsersScreen.tsx`
- Modify: `src/admin/shell/AdminShell.tsx`

**Interfaces:**
- Consumes: `PageDraft` из Task 1, `setUserRole`, `storageNotice`.

- [ ] **Step 1: Implement the screens**

Редактор страницы ветвится по ключу: главная, shop-home, остальные. Материал получает фото и галерею. Пользователь меняет роль. Оболочка показывает уведомление хранилища один раз.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit; npx vitest run src/admin`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/admin/pages src/admin/materials src/admin/media src/admin/users src/admin/shell src/app
git commit -m "Finish pages, materials, media usage, and user roles."
```
