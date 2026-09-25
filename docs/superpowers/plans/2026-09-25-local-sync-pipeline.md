# Local sync: DB + CMS + website

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Локально одна база `bizon` на порту 5433 кормит админку и публичный сайт: черновик виден только в CMS, опубликованная карточка шины, герой главной и статья Tire IQ видны на сайте.

**Architecture:** Физические таблицы Postgres не переписываем. Новый процесс `backend-app` — единственный, кто читает базу для сайта. CMS пока пишет в те же таблицы своим `postgresAdmin`, но публикация первого среза дописывает поля, которые карточка сайта уже рисует. Сайт не открывает `pg`: он забирает готовые `Cms*` по HTTP и сливает страницы с дефолтами из кода. Вынос записи CMS в backend — следующая волна, после того как чтение сайта совпало с публикацией.

**Tech Stack:** Postgres 16 на `127.0.0.1:5433` / база `bizon`. CMS — Next.js в репозитории `Bizon`, порт 3000. Сайт — Next.js в `Bizon-main-app`, порт 3001. Backend — Node HTTP в `Bizon-main-app/backend-app`, порт 4000. Контракт сайта — `src/lib/content/types.ts`. Контракт админки — `AdminClient`.

## Global Constraints

- Payload как приложение не возвращаем. Таблицы, которые он оставил, остаются хранилищем.
- Админка не импортирует код сайта. Оба сверяются с матрицей полей в этом плане.
- На сайт попадают только строки `status = 'published'`. Таблица `cms_drafts` сайту не отдаётся.
- Пустое поле опубликованной страницы остаётся дефолтом из кода сайта (`mergeHomeContent` и соседние функции).
- Публичный `id` — строка из числового id базы.
- `descriptionLong` и текст статьи на сайт уходят строкой HTML, которую уже умеет `LexicalContent`. Сырой Lexical JSON на сайт не уходит.
- На localhost вход по паролю не делаем.
- `main-app` не получает `DATABASE_URI` и пакет `pg`.

---

## Что считается локальной синхронизацией

Три процесса и одна база.

| Процесс | Порт | База |
| --- | --- | --- |
| Postgres `bizon-postgres` | 5433 | владелец данных |
| `frontend-cms` | 3000 | пишет черновик в `cms_drafts`, публикацию — в канонические таблицы |
| `backend-app` | 4000 | читает только опубликованное и отдаёт `Cms*` |
| `main-app` | 3001 | рисует ответ backend, свою базу не открывает |

Проверка, после которой волна 1 закрыта:

1. В CMS меняется короткое описание опубликованной модели шины и нажимается «Опубликовать».
2. `GET http://127.0.0.1:4000/v1/tires/models/{tireTypeSlug}/{modelSlug}` возвращает новое описание, бренд, протектор, оси, размеры, цену и URL главного фото. Черновик другой модели в ответ не входит.
3. Страница `http://127.0.0.1:3001/models/{tireTypeSlug}/...` показывает те же поля.
4. Правка героя главной в CMS после публикации меняет заголовок на `http://127.0.0.1:3001/`. Пустой блок остаётся текстом из кода сайта.
5. Опубликованная статья Tire IQ открывается на `/tire-iq/{slug}`, текст виден как HTML.

Волна 1 не обещает галерею дисков, варианты shop, служебные страницы «О компании» и заявки. Они стоят в волнах 2 и 3, потому что сайт их либо не читает из CMS, либо CMS их не записывает.

## Матрица первого среза

Поля, которые `TireModelStage` уже рисует. Колонка «Сейчас» — поведение `writeTireModel` в `Bizon/src/admin/server/postgresAdmin.ts`.

| Поле сайта | Откуда в базе | Сейчас при публикации CMS |
| --- | --- | --- |
| `name`, `slug`, `tireTypeSlug` | `tire_models` + `tire_types` | пишется |
| `descriptionShort` | `short_description` | пишется |
| `descriptionLong` | `full_description` jsonb | пишется как Lexical, сайт ждёт HTML |
| `brand` | колонки нет, есть `series` | не пишется; в первом срезе `brand` = `series`, пустое → сайт сам ставит «BIZON TBR» |
| `treadType` | `tread_type` | не пишется, дописать в `UPDATE` |
| `imageUrl` | `media.url` по `main_image_id` | пишется id; URL собирает backend. Значение `data:` считается пустым |
| `gallery` | связи `tire_models_rels` path `gallery` | не пишется; в срезе 1 сайт получает `[]`, галерея — волна 2 |
| `advantages` | `tire_models_features` (`key`, `title`, `description`) | обновляются только уже существующие строки; срез 1 читает то, что уже в базе |
| `selectionAxles` | `tire_models_positions` | пишется |
| размеры, цена, «по запросу» | `tire_variants` | пишется |
| герой главной: eyebrow, title, lead, CTA, metric | колонки `pages.home_hero_*` и `seo_*` | пишется текстом, картинка героя — волна 2 |
| статья: title, slug, excerpt, content, publishedAt | `tire_iq_articles` | текст пишется Lexical-ом; backend отдаёт HTML |

`applicationCategory` на карточке модели в `TireModelStage` не выводится. В срез 1 не входит.

## Порядок волн

```text
Волна 1  Чтение опубликованного среза
         backend-app отдаёт шины, героя главной и статьи
         CMS дописывает tread_type
         сайт подменяет пустой staticCatalog и getPageContent
Волна 2  Запись недостающего, что карточка уже умеет показать
         галерея шин, преимущества create/delete, картинка героя
         диски и shop тем же приёмом
         служебные страницы сайта переводятся на getPageContent
Волна 3  CMS перестаёт открывать pg
         запись идёт в backend-app методами AdminClient
         заявки и корзина
```

Волна 2 и волна 3 — отдельные планы. Их вход: волна 1 проходит проверку из раздела выше. Этот документ их не реализует и не разрешает копировать `postgresAdmin.ts` в новый сервис целиком.

## Файлы волны 1

Создаются в `Bizon-main-app`:

- `backend-app/package.json` — скрипт `dev` на порту 4000, зависимость `pg`
- `backend-app/src/mapTire.ts` — строка базы → `CmsTireModel` / `CmsTireVariant` / `CmsTireType`
- `backend-app/src/mapPage.ts` — строка `pages` → патч героя главной
- `backend-app/src/mapArticle.ts` — Lexical или строка → HTML
- `backend-app/src/publishedRead.ts` — запросы только `status = 'published'`
- `backend-app/src/server.ts` — маршруты ниже
- `backend-app/src/mapTire.test.ts`, `mapPage.test.ts`, `mapArticle.test.ts`

Меняются:

- `Bizon/src/admin/server/postgresAdmin.ts` — в `UPDATE tire_models` добавить `tread_type`
- `Bizon-main-app/src/lib/content/publishedClient.ts` — HTTP к `CONTENT_API_URL`, при пустом URL остаются нынешние пустые ответы и дефолты страниц
- `Bizon-main-app/src/lib/content/staticCatalog.ts` — функции шин и статей вызывают `publishedClient`, если URL задан
- `Bizon-main-app/src/lib/content/getPageContent.ts` — для `home` сливает патч с `mergeHomeContent`
- `Bizon-main-app/.env.example` — `CONTENT_API_URL=http://127.0.0.1:4000`
- `Bizon-main-app/package.json` — `dev` на порту 3001, чтобы не столкнуться с CMS на 3000

Маршруты backend, волна 1:

- `GET /v1/tires/types`
- `GET /v1/tires/types/:slug`
- `GET /v1/tires/types/:slug/models`
- `GET /v1/tires/models/:typeSlug/:modelSlug`
- `GET /v1/tires/models/:id/variants`
- `GET /v1/pages/home`
- `GET /v1/articles`
- `GET /v1/articles/:slug`
- `GET /health`

Ответ модели — объект формы `CmsTireModel`. Ответ главной — патч, который принимает `mergeHomeContent`, не полная страница. Ответ статьи — `CmsArticle` с `content: string` (HTML).

---

### Task 1: Маппер шины без базы

**Files:**

- Create: `Bizon-main-app/backend-app/src/mapTire.ts`
- Test: `Bizon-main-app/backend-app/src/mapTire.test.ts`

**Interfaces:**

- Consumes: фикстуры полей `tire_models`, `tire_types`, `tire_variants`, `media`, `tire_models_positions`, `tire_models_features`
- Produces:
  - `mapTireType(row, selection): CmsTireType`
  - `mapTireModel(input): CmsTireModel`
  - `mapTireVariant(row): CmsTireVariant`
  - `lexicalToHtml(value: unknown): string`

- [ ] **Step 1: Падающий тест на карточку, которую рисует сайт**

```ts
import { describe, expect, it } from "vitest";
import { lexicalToHtml, mapTireModel, mapTireVariant } from "./mapTire";

describe("mapTireModel", () => {
  it("maps a published row into the card the site renders", () => {
    const model = mapTireModel({
      row: {
        id: 24,
        name: "DSR188",
        slug: "dsr188",
        short_description: "Магистраль",
        full_description: { root: { children: [{ children: [{ text: "Длинный текст" }] }] } },
        series: "BIZON",
        tread_type: "ребро",
        status: "published",
      },
      tireType: { slug: "tbr", name: "TBR" },
      imageUrl: "/media/dsr188.jpg",
      gallery: [],
      advantages: [{ key: "handling", title: "Управление", description: "Держит колею" }],
      selectionAxles: ["steer"],
    });
    expect(model).toMatchObject({
      id: "24",
      slug: "dsr188",
      tireTypeSlug: "tbr",
      brand: "BIZON",
      treadType: "ребро",
      descriptionShort: "Магистраль",
      descriptionLong: "<p>Длинный текст</p>",
      imageUrl: "/media/dsr188.jpg",
      gallery: [],
      selectionAxles: ["steer"],
    });
  });

  it("drops data urls and draft rows are not mapped by the reader", () => {
    const model = mapTireModel({
      row: {
        id: 1,
        name: "X",
        slug: "x",
        short_description: "",
        full_description: null,
        series: null,
        tread_type: null,
        status: "published",
      },
      tireType: { slug: "tbr", name: "TBR" },
      imageUrl: "data:image/png;base64,aaaa",
      gallery: [],
      advantages: [],
      selectionAxles: [],
    });
    expect(model.imageUrl).toBeNull();
    expect(model.brand).toBe("");
  });
});

describe("mapTireVariant", () => {
  it("keeps price and price-on-request", () => {
    expect(
      mapTireVariant({
        id: 7,
        size: "315/80R22.5",
        price: null,
        price_on_request: true,
        available: true,
      }).priceOnRequest,
    ).toBe(true);
  });
});

describe("lexicalToHtml", () => {
  it("passes an existing html string through", () => {
    expect(lexicalToHtml("<p>Уже html</p>")).toBe("<p>Уже html</p>");
  });
});
```

- [ ] **Step 2: Запустить тест и увидеть FAIL**

Run in `Bizon-main-app/backend-app`: `npx vitest run src/mapTire.test.ts`

Expected: FAIL, `mapTireModel` is not defined.

- [ ] **Step 3: Реализовать маппер**

`lexicalToHtml` собирает текстовые узлы Lexical в один абзац `<p>…</p>`, экранирует `<`, `>`, `&`. Строка, в которой уже есть тег `<p` или `<br`, возвращается как есть. `data:` в URL становится `null`. `id` становится `String(row.id)`. `brand` берётся из `series`. Пустые оси — `[]`.

- [ ] **Step 4: Тест PASS**

Run: `npx vitest run src/mapTire.test.ts`

Expected: PASS.

---

### Task 2: Маппер главной и статьи

**Files:**

- Create: `Bizon-main-app/backend-app/src/mapPage.ts`
- Create: `Bizon-main-app/backend-app/src/mapArticle.ts`
- Test: `Bizon-main-app/backend-app/src/mapPage.test.ts`
- Test: `Bizon-main-app/backend-app/src/mapArticle.test.ts`

**Interfaces:**

- Consumes: `lexicalToHtml` из `mapTire.ts`
- Produces:
  - `mapHomePatch(row): HomePatch` с полями `seoTitle`, `seoDescription`, `hero.eyebrow|title|lead|primaryCta|secondaryCta|metricLabel|metricText`. Картинку героя не включает.
  - `mapArticle(row): CmsArticle`

- [ ] **Step 1: Тест главной отбрасывает пустые строки, чтобы сайт оставил дефолт**

Пустые `home_hero_title` не попадают в патч (`undefined`, не `""`). Заполненный title попадает.

- [ ] **Step 2: Тест статьи**

Lexical jsonb становится HTML в `content`. `publishedAt` — ISO из `published_at`. `imageUrl` из join `media.url`, `data:` → `null`.

- [ ] **Step 3: Реализация и PASS**

Run: `npx vitest run src/mapPage.test.ts src/mapArticle.test.ts`

---

### Task 3: Чтение только опубликованного

**Files:**

- Create: `Bizon-main-app/backend-app/src/publishedRead.ts`
- Create: `Bizon-main-app/backend-app/src/publishedRead.test.ts`

**Interfaces:**

- Consumes: `mapTireModel`, `mapTireVariant`, `mapHomePatch`, `mapArticle`
- Produces: функции `readTireTypes`, `readTireModel`, `readTireVariants`, `readHomePatch`, `readArticles`, `readArticleBySlug`. Аргумент — объект с методом `query(sql, params)`.

- [ ] **Step 1: Тест на фейковом query**

SQL шин содержит `status = 'published'` и для модели, и для направления, и для варианта. Запрос с slug черновика возвращает `null`. `readHomePatch` читает `pages` где `key = 'home'` и `status = 'published'`; при `draft` возвращает `null`.

- [ ] **Step 2: Реализация**

Один запрос модели делает join `tire_types` и `media`. Оси и features — отдельные запросы по `parent_id` / `_parent_id`. Варианты сортируются `sort_order`, `id`.

- [ ] **Step 3: PASS**

Run: `npx vitest run src/publishedRead.test.ts`

---

### Task 4: HTTP backend на порту 4000

**Files:**

- Create: `Bizon-main-app/backend-app/src/server.ts`
- Create: `Bizon-main-app/backend-app/package.json`
- Modify: `Bizon-main-app/backend-app/README.md`

**Interfaces:**

- Consumes: функции из `publishedRead.ts`
- Produces: процесс `npm run dev` → `http://127.0.0.1:4000`. `DATABASE_URI` обязателен, значения по умолчанию нет.

- [ ] **Step 1: `GET /health` отвечает `{ ok: true }` без базы**

- [ ] **Step 2: Остальные маршруты из списка выше**

Неизвестный slug → 404 `{ ok: false }`. Ошибка базы → 500 без текста SQL.

- [ ] **Step 3: Проверка на живой базе**

Postgres уже на 5433. Запуск backend с `DATABASE_URI` из локального `.env`.

```text
GET /v1/tires/types
```

Ожидание: массив, в нём slug `tbr` и `otr`, без черновиков. Число моделей TBR больше нуля.

---

### Task 5: CMS записывает протектор

**Files:**

- Modify: `Bizon/src/admin/server/postgresAdmin.ts` функция `writeTireModel`
- Test: рядом с существующим `src/admin/server/postgresAdmin.test.ts`, отдельный чистый тест не на живую базу: вынести список колонок нельзя без рефакторинга. Проверка — чтение SQL-строки в тесте через экспорт константы `TIRE_MODEL_PUBLISH_COLUMNS`.

**Interfaces:**

- Produces: `UPDATE tire_models` включает `tread_type=$12`

- [ ] **Step 1: Добавить `tread_type` в `UPDATE` и передать `draft.treadType || null`**

Колонку `brand` не создавать. Бренд первого среза — уже существующая `series`. Если в черновике `brand` заполнен, а `series` пуст, писать `brand` в `series` тем же `UPDATE` (добавить `series`).

- [ ] **Step 2: Опубликовать одну модель в CMS и прочитать её через `GET /v1/tires/models/...`**

`treadType` и `brand` в JSON совпадают с тем, что сохранено в админке.

---

### Task 6: Сайт читает backend

**Files:**

- Create: `Bizon-main-app/src/lib/content/publishedClient.ts`
- Modify: `Bizon-main-app/src/lib/content/staticCatalog.ts`
- Modify: `Bizon-main-app/src/lib/content/getPageContent.ts`
- Modify: `Bizon-main-app/package.json` script `dev`
- Modify: `Bizon-main-app/.env.example`
- Test: `Bizon-main-app/src/lib/content/publishedClient.test.ts`

**Interfaces:**

- Consumes: маршруты Task 4
- Produces:
  - `publishedApiEnabled(): boolean` — истина, когда `process.env.CONTENT_API_URL` не пуст
  - `fetchPublishedJson<T>(path): Promise<T | null>` — `cache: "no-store"`
  - При выключенном URL каталожные функции остаются пустыми, `getPageContent` возвращает дефолт, как сейчас

- [ ] **Step 1: Тест клиента с подменённым fetch**

`CONTENT_API_URL=http://127.0.0.1:4000`, путь `/v1/tires/types/tbr` собирается без двойного слэша. Ответ 404 → `null`. Сеть недоступна → `null`, исключение не всплывает на страницу.

- [ ] **Step 2: Ветки в `staticCatalog`**

Функции шин и Tire IQ: если API выключен — текущий пустой возврат. Если включен — JSON backend. Колёса, shop и истории в этой волне остаются пустыми даже при включенном API.

- [ ] **Step 3: Главная**

`getPageContent("home")` при включенном API вызывает `mergeHomeContent(defaults, patch)`. Патч `null` → чистый дефолт. Остальные ключи страниц в этой волне остаются дефолтом из кода.

- [ ] **Step 4: `npm run dev` сайта слушает 3001**

`"dev": "next dev -p 3001"`. CMS не трогаем, она остаётся на 3000.

- [ ] **Step 5: Сквозная проверка из раздела «Что считается локальной синхронизацией»**

Три процесса запущены. Пункты 1–5 выполнены вручную в браузере: правка описания шины, карточка на сайте, заголовок главной, статья, черновик на сайт не попал.

---

## Волна 2 — отдельный план, вход после Task 6

Писать после зелёной сквозной проверки. Состав, без реализации здесь:

1. Публикация галереи шины в `tire_models_rels` и чтение её в `gallery: string[]`.
2. Создание и удаление строк `tire_models_features`, чтобы преимущества из CMS доезжали до `advantages`.
3. Картинка героя главной: `home_hero_image_id` → URL в патче `mergeHomeContent`.
4. Тот же приём для диска: новые `wheel_variants` INSERT, галерея из `wheel_models_rels`.
5. Товар shop: `products_variants` и `full_description` как HTML.
6. Маршруты about, contact, warranty, branding, become-a-supplier, privacy-policy, shop-delivery-returns перестают держать текст только в JSX и вызывают `getPageContent`.

Пока пункт 6 не сделан, публикация этих страниц в CMS на сайт не влияет. Это не баг волны 1.

## Волна 3 — отдельный план

CMS удаляет `pg` и `postgresAdmin`. `remoteAdminClient` ходит на `backend-app` теми же методами `AdminClient` и теми же кодами ошибок. Backend становится единственным писателем. Заявки: `POST /api/requests` сайта проксирует уже существующий `normalizeRequest` на backend, строка появляется в `requests`. Корзина — после выбора контракта cookie-сессии; текущий маршрут 503 и e2e расходятся, в волны 1–2 не входят.

## Перепроверка

- Сквозная цель «черновик в CMS, публикация на сайте» закрыта Task 4–6 для шины, героя главной и статьи. Диски, shop и служебные страницы явно отложены, сайт их сейчас не может показать из CMS.
- Сайт не получает прямую строку базы: между ними `backend-app` и типы `Cms*`.
- Копирование `postgresAdmin` запрещено разделом волн.
- Пустой патч страницы не затирает дефолт: это Task 2 и `mergeHomeContent`.
- Черновик отсекается SQL `status = 'published'` в Task 3, не фильтром на сайте.
- В плане нет второго набора таблиц «снимок». Хранилище одно.

## Блокеры, которые этот pipeline не прячет

- Галерея, PDF и новые преимущества шины после волны 1 на сайте пустые, даже если в CMS они заполнены.
- Служебные страницы сайта не читают CMS, пока не сделан пункт 6 волны 2.
- Медиа с `url`, начинающимся на `data:`, на сайте не показывается.
- Кэш сегмента сайта `revalidate = 60` в `src/app/(site)/layout.tsx`. Клиент волны 1 ставит `cache: "no-store"` на запрос к backend, чтобы локальная публикация не ждала минуту.
- `/api/admin` CMS без входа. На localhost это совпадает со спекой. В backend методы записи не переносятся, пока нет волны 3.
- Оба Next раньше занимали порт 3000. Волна 1 разводит их на 3000 и 3001.
