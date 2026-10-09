# Аудит готовности Bizon CMS к боевому использованию

**Дата проверки:** 2026-10-03 (Asia/Vladivostok)  
**Охват:** активный checkout `Bizon-main-app`, включая публичный сайт, `frontend-cms` и `backend-app`.  
**Метод:** чтение кода и конфигурационных имён, проверка Git-состояния, локальных слушающих портов и read-only подключений к PostgreSQL/S3 после отдельного разрешения пользователя. Значения секретов и байты объектов не выводились/не читались; запись, миграции, upload и delete не выполнялись.

> **Поправка к границам источников и CI (2026-10-03):** дальнейшая проверка установила, что `backend-app/` и `frontend-cms/` в корне — игнорируемые Git-копии, а не источники активных веток. Актуальные деревья находятся в `.git-worktrees/backend-app` (ветка `backend-app`, HEAD `ea533ea`, есть незакоммиченные изменения) и `.git-worktrees/frontend-cms-push` (ветка `frontend-cms-push`, HEAD `b477280`, чистая). Корневой сайт — ветка `main-app`, HEAD `991cb18`. Удалённый GitHub refs API подтвердил те же три HEAD; репозиторий `mrdudekowski/bizon-shop` имеет default branch `backend-app`, видимость public. Корневой Git не отслеживает nested-каталоги CMS/backend.
>
> По актуальному backend дополнительно подтверждены runtime DDL-пути: `src/server.ts:553-555` вызывает `ensureAuthSchema()` при старте, а `postgresAdmin.ts:134-143` создаёт `cms_drafts` по запросам чтения/записи черновиков. В `publishChangeSet()` (`postgresAdmin.ts:1745-1759`) change set записывается как `published` до последовательных `publishEntry()`; транзакции в функции нет. Проверка БД выполнена отдельными `BEGIN READ ONLY`/`SELECT`/`ROLLBACK`; приложение не запускалось, тесты/миграции/записи не выполнялись. Незакоммиченные backend-файлы `src/admin/server/postgresAdmin.ts`, `src/mapPage.ts`, `src/mapPage.test.ts`, `src/publishedRead.ts`, `src/publishedRead.test.ts` сохранены без изменений.
>
> Diffs backend-файлов ограничены полями главной страницы `directions`/`expertise` и соответствующим read/write mapping; они не добавляют stories или Shop subcategory flow. Все шесть новых homepage columns присутствуют в проверенной локальной `pages`; применимость к staging/prod не подтверждена. Root dirty diff добавляет отображение `applicationTypes`; при этом активный backend public `CmsTireModel`/`mapTireModel` не экспортирует ни `applicationTypes`, ни `applicationCategory`, хотя CMS их хранит и public tire-model stage теперь читает.
>
> В репозитории найден только `.github/workflows/deploy.yml` на ветке `main-app`; он выполняет lint, typecheck, unit tests и build и **не содержит deploy-шагов**. В GitHub Actions последний доступный run на момент проверки — [run 36718178829](https://github.com/mrdudekowski/bizon-shop/actions/runs/36718178829), завершился ошибкой typecheck: `src/app/api/requests/route.ts` обращается к `ValidationResult.error/message` без сужения discriminated union, а `src/lib/catalog/featuredAssortment.ts:23` содержит несовместимый type predicate (`string` вместо union `"Рулевая" | "Ведущая" | "Прицепная"`). Ветки в GitHub отмечены `protected: false`. Backend и CMS ветки собственного workflow/deployment config в деревьях не содержат.
>
> Локальные `.env.local`/`.env` описывают dev-настройку: сайт/CMS API направлены на loopback `127.0.0.1:4000`, `DATABASE_URI` в игнорируемой root-копии backend имеет loopback host, а S3 endpoint настроен на внешний хост Timeweb. Это не подтверждает, что удалённый bucket относится к staging или production. Значения секретов не выводились.
>
> Read-only runtime проверка после разрешения пользователя: локально достижим PostgreSQL; транзакция подтвердила `transaction_read_only=on`; в `public` всего 49 таблиц. Все 18 проверенных таблиц CMS/сайта присутствуют, включая `cms_auth_sessions`, `cms_change_sets`, `cms_drafts`, `media`, каталоги, `people_stories`, `tire_iq_articles`, `pages` и `pages_shop_category_carousel`. В `media` найдено 40 строк; все шесть локальных homepage columns `directions`/`expertise` также существуют в `pages`. Классификация connection string — loopback, то есть это локально настроенная БД, не подтверждённый staging/prod.
>
> В той же локально настроенной БД найдена таблица `payload_migrations`; она сама по себе не доказывает, что runtime DDL custom backend управляется этим ledger. Также существуют `shop_subcategories`, `shop_category_carousel`, `cms_auth_bootstrap_state`, `cms_auth_credentials` и `users_sessions`, прямое использование которых в активном backend source search не найдено. До миграции нужно установить их владельца/происхождение, не объявляя их лишними по одному отсутствию ссылок в коде. У credential, загруженного из игнорируемого `backend-app/.env`, metadata checks показывают `CREATE` на схеме `public`, `INSERT/DELETE` на `media` и `UPDATE` на `pages`. Роль/конфигурация активного backend worktree не подтверждены: env находится только в игнорируемой root-копии, поэтому это не доказательство production grants, но показывает, что локальная credential не ограничена read-only и имеет DDL-способность.
>
> Для bucket из игнорируемого локального backend env `HeadBucket` вернул HTTP 200. Для одной HTTPS-ссылки из `media`, на том же host, что настроенный `S3_PUBLIC_URL`, read-only HTTP `HEAD` вернул 200 и `image/png`. Это подтверждает доступность bucket и одного уже сохранённого публичного объекта. Существующая конфигурация S3 остаётся не классифицированной по среде; `PutObject`-право, генерация новой ссылки, backup/versioning и удаление не проверялись.
>
> GitHub run `36718178829` собран именно из текущего `main-app` HEAD `991cb185d255ff09cef8966e216ef5f94cb8a68b`; то есть красная проверка относится к проверяемому commit, а не к более старой ревизии. До падения typecheck в этом workflow прошёл lint; unit tests и build этим run не достигались. GitHub deployment API для репозитория не вернул deployment records. Это не исключает внешний CD, настроенный в кабинете хостинга.
>
> На актуальной CMS-ветке публичный adapter по умолчанию направляет запросы в `http://127.0.0.1:4000` через `NEXT_PUBLIC_ADMIN_API_URL` (`frontend-cms/src/admin/client/localStore.ts:1281-1292`). UI и типы CMS содержат CRUD подкатегорий (`adminClient.ts:66-69` и редакторы Shop), но в backend-ветке соответствующих методов/маршрутов не найдено; public mapper/read model также не содержит подкатегорий. Backend поддерживает административное чтение/редактирование `people_stories` (`postgresAdmin.ts:1549`, `1577-1645`), но публичные getters сайта `getPeopleStories()`, `getPeopleStoryBySlug()` и slug list в `src/lib/content/staticCatalog.ts:269-279` сейчас возвращают пустые результаты, а backend public read exposes `tire_iq_articles`, не `people_stories`. Сквозной опубликованный путь для этих двух CMS-разделов статически не подтверждён.
>
> Дополнительный P0 по соединению: активный CMS отправляет запросы напрямую на `NEXT_PUBLIC_ADMIN_API_URL`; его Next route `/api/admin` специально возвращает HTTP 410, а не проксирует запросы. Backend CORS (`backend-app/src/server.ts:64-74`) выдаёт credentialed CORS только для `localhost` и `127.0.0.1`, а слушатели создаются только на `127.0.0.1` и `::1` (`server.ts:545-551`). Значит, разнесённые production CMS/backend origins по текущему коду не соединятся без изменения CORS/bind или специально настроенного same-host reverse proxy. Сессионный cookie получает `Secure` только если backend видит `X-Forwarded-Proto: https` (`server.ts:139-141`, `adminAuth.ts:65-74`). Production proxy/DNS/topology не подтверждены.

## 1. Краткое резюме

**Статус: production-ready не подтверждён; по коду выявлены P0-блокеры. Итоговый числовой балл снят до полного повторного аудита активных branch-worktree и получения карты окружений.**

Код содержит работающую архитектурную основу для каталога шин и дисков, страниц, товаров, медиа, учётных записей и очереди публикаций. Публичный backend фильтрует большинство сущностей по `status = 'published'`, а сайт читает API без собственного доступа к БД.

До боевого использования остаются блокирующие проблемы:

1. Backend выполняет DDL на старте и при доступе к draft overlays; публичный `GET /v1/shop/categories` — только чтение.
2. Публикация набора изменений помечает набор опубликованным до завершения всех записей; публикация части типов также состоит из отдельных запросов без общей транзакции.
3. Для историй клиентов и подкатегорий Shop редакторские сценарии не имеют полного backend → публичный API → сайт пути.
4. CMS сохраняет категории применения шин, но публичный backend mapper не выдаёт `applicationCategory`/`applicationTypes`; изменённая корневая страница уже использует `applicationTypes`.
5. CMS browser-клиент обращается к backend напрямую; backend CORS ограничен localhost, а слушатели привязаны к loopback. Production-связность не доказана.
6. Публичный сайт при ошибках backend тихо подставляет кодовые defaults или пустые списки. Ошибка источника неотличима от отсутствия контента.
7. CI для точного текущего `main-app` commit падает на typecheck; deploy workflow в репозитории не найден.
8. Локальная и production-топология не доказаны. Production URL, staging-клон БД, принадлежность настроенного S3 bucket к конкретной среде, резервирование и восстановление не подтверждены; доступность одного объекта в настроенном bucket проверена отдельно.

Результат характеризует код и локальную конфигурацию на дату проверки, а не состояние опубликованного сайта.

## 2. Границы системы и метод проверки

### Проверяемая система

| Часть | Наблюдаемая граница |
|---|---|
| Публичный сайт | Корневой Next.js 15 пакет в `Bizon-main-app`, ветка `main-app`, HEAD `991cb18` от 2026-09-30. Git remote — `bizon-shop.git`. |
| CMS UI | Источник активной CMS-ветки: `.git-worktrees/frontend-cms-push/`, ветка `frontend-cms-push`, HEAD `b477280` (чистая на момент повторной проверки). Next.js App Router, формы находятся в `src/admin/`. Корневой `frontend-cms/` — игнорируемая копия и не источник истины. |
| Backend | Источник активной backend-ветки: `.git-worktrees/backend-app/`, ветка `backend-app`, HEAD `ea533ea`; пять файлов имеют пользовательские незакоммиченные изменения. Node HTTP server на порту 4000, PostgreSQL через `pg`. Корневой `backend-app/` — игнорируемая копия и не источник истины. |
| Другой checkout | Вложенный `frontend-dev-sasha/` — отдельная Git-ветка `frontend-dev`; не включён в подтверждённый контракт CMS ↔ `main-app` ↔ `backend-app`. Его production-роль не установлена. |
| Данные | PostgreSQL (`DATABASE_URI`), таблицы приложения и Payload-подобные таблицы; метаданные медиа в `media`, объекты — S3-совместимое хранилище. Точное production-размещение и владельцы БД неизвестны. |
| URL в локальной конфигурации | Публичный сайт задаёт `CONTENT_API_URL` на loopback:4000; backend привязан к loopback:4000. CMS branch использует `NEXT_PUBLIC_ADMIN_API_URL`, default — `http://127.0.0.1:4000`; это прямой browser URL, не proxy. |
| Публичный CDN/объектное хранилище | В локальных env-файлах заданы `S3_ENDPOINT` и `S3_PUBLIC_URL` на внешнем хосте Timeweb. После разрешения пользователя `HeadBucket` вернул 200, а `HEAD` одного сохранённого публичного media URL вернул 200 (`image/png`). Принадлежность bucket к dev/staging/prod и права записи не подтверждены. |

В корневом рабочем дереве есть многочисленные пользовательские изменения и untracked-файлы сайта, изображений и `tmp/`. В backend-worktree ещё до аудита имелось пять незакоммиченных пользовательских изменений; они сохранены. Во время аудита ни root/site, ни backend, ни CMS код не менялись. Выводы различают исходный tracked commit и фактический working tree там, где изменения могут влиять на конкретные поля.

Проверены безопасные адреса и классы хостов в корневом `.env.local`, а также в env-файлах игнорируемых root-копий `backend-app/` и `frontend-cms/`; секретные значения не выводились. Активные branch-worktree backend/CMS содержат только backend `.env.example` либо вообще не содержат env-файла; значения из root-копий не являются доказательством их конфигурации или production. По отдельному разрешению пользователя сделаны read-only запросы к loopback DB и настроенному удалённому S3 (результаты выше); они не классифицируют удалённый bucket как staging или production.

Порты 3000, 3001 и 4000 не слушали. Поэтому HTTP, браузер, сетевое поведение, БД, S3, CDN и production не проверены. Backend не запускался: его startup вызывает `ensureAuthSchema()` и создаёт/меняет таблицы. Тесты, сборки, миграции, seed, публикация и запись данных не запускались. Это согласуется с запретом из запроса и важно для интерпретации оценки.

Область безопасности — статический просмотр кода конфигурации и auth-flow; это не penetration test и не сертификационная оценка.

### Ограничения и точка истины

README корневого `main-app` описывает только публичный пакет, поэтому замечания про отсутствие `/admin` и отдельную CMS не противоречат раздельным веткам. README активной `frontend-cms` ветки устарел: он говорит, что backend не подключён, тогда как `browserAdminClient()` отправляет запросы на backend URL. Фактические связи ниже установлены по исходникам, не по CMS README.

## 3. Архитектура и потоки данных

```text
Редактор в frontend-cms
  → browserAdminClient() в frontend-cms/src/admin/client/localStore.ts
  → прямой browser HTTP-запрос на NEXT_PUBLIC_ADMIN_API_URL (/v1/admin)
  → backend-app /v1/admin* (cookie auth + dispatchAdminCall)
  → createPostgresAdminClient() → PostgreSQL
       черновые изменения: cms_drafts
       очередь: cms_change_sets
       опубликованные записи: tire_types, tire_models, wheel_*, shop_*, pages,
                              tire_iq_articles, people_stories, media и связанные таблицы
  → GET /v1/* из backend-app/publishedRead.ts
  → CONTENT_API_URL fetch из src/lib/content/publishedClient.ts
  → read model и страницы Next.js
  → посетитель сайта

Медиа: браузерный upload → backend /v1/admin/assets → S3 PutObject → строка media
       → CMS хранит assetId → публикация связывает ID → публичный API отдаёт URL.
```

CMS-клиент по умолчанию удалённый: `browserAdminClient()` возвращает `remoteAdminClient()`, который обращается непосредственно к `NEXT_PUBLIC_ADMIN_API_URL` с `credentials: include`. Существующий `createLocalAdminClient()` — локальная реализация/тестовый путь, не текущая browser-точка записи. CMS route `/api/admin` намеренно отвечает HTTP 410 и не проксирует запросы. Публичный сайт использует отдельный `CONTENT_API_URL`.

### Матрица типов данных

| Тип / раздел CMS | Хранение и публикация | Публичное чтение / отображение | Статус доказательства |
|---|---|---|---|
| Направления и модели шин, размеры, признаки, изображения | `tire_types`, `tire_models`, `tire_variants`, relation/feature tables; `applicationTypes` сохраняются в `tire_models_application_types`; черновики через `cms_drafts`. | `/v1/tires/*`; `staticCatalog.ts`, tire catalog, `/models/*`. Public SQL фильтрует опубликованные модель, направление и варианты, но `mapTireModel`/`CmsTireModel` не включают `applicationCategory` или `applicationTypes`. | Неполный публичный field contract подтверждён кодом; таблица application types есть в локальной БД. |
| Типы и модели дисков, варианты и галерея | `wheel_types`, `wheel_models`, `wheel_variants`, media relations; draft overlay; публикация модели обёрнута в транзакцию. | `/v1/wheels/*`; `staticCatalog.ts`, `/shop/wheels/*`. | Подтверждено кодом; runtime/production не проверены. |
| Категории Shop и товары, варианты, галерея | `shop_categories`, `products`, `products_variants`, relation table; draft overlay. Страница `shop-home` дополнительно читает `pages_shop_category_carousel`; schema creation в активном backend-коде не найдено, но таблица присутствует в проверенной локальной БД. | `/v1/shop/categories`, `/v1/shop/products`; shop read model и `/shop/*`. Категории/товары фильтруются по published. | Код проверен; локальная БД содержит таблицы, production не проверен. |
| Подкатегории Shop | Есть UI/types и вызовы `list/create/save/deleteShopSubcategory` в CMS. Методы в backend `AdminClient`/`postgresAdmin.ts` не найдены. В локальной БД существуют `shop_subcategories` и `products.shop_subcategory_id`, но активный backend source search эти объекты не использует. | Не включены в public API или mapper товара; публичный сайт не использует `subcategoryId`. | Неполный поток подтверждён кодом; CMS и локальная схема явно моделируют функцию, но публичный contract отсутствует. Происхождение локальной схемы не установлено. |
| Главная, Shop landing и фиксированный набор stub-страниц | Страницы в `pages`; `savePage` пишет overlay; публикация вызывает `writePage`. Поддерживаются ключи `home`, `shop-home` и около семи фиксированных публичных страниц. | `/v1/pages/home`, `/v1/pages/shop-home`, `/v1/pages/:key`; `getPageContent()` и `getPublishedStubOverlay()`. Главная и Shop landing дополняют кодовые defaults. | Подтверждено кодом; runtime/production не проверены. |
| Материалы: Tire IQ articles и stories | CMS объединяет `tire_iq_articles` и `people_stories`; публикация пишет разные таблицы. Текст превращается в простую Lexical paragraph JSON. | `/v1/articles*` читает только `tire_iq_articles`. `getPeopleStories()` и `getPeopleStoryBySlug()` в публичном read model безусловно возвращают пустые значения. | Для stories сломанный сквозной путь подтверждён кодом. |
| Медиа | S3-совместимое объектное хранилище плюс метаданные `media` в PostgreSQL. Допустимые заявленные MIME: JPEG, PNG, WebP, MP4, PDF; максимум 20 MiB. Проверка сигнатуры файла не найдена. | Сайт получает URL изображения/документа из backend read model и использует remote image patterns. | Один сохранённый URL доступен по HTTP HEAD; новый upload и production URL не проверены. |
| Учётные записи, права, очередь публикаций | `users`, `cms_auth_sessions`, `cms_change_sets`; password scrypt, случайный session token, в БД сохраняется SHA-256 token hash; cookie HttpOnly, SameSite=Lax, срок 12 часов. | Не публичные данные. Для редактора доступны разрешённые действия; публикация/review требуют admin. | Подтверждено кодом; настроенные аккаунты и runtime auth не проверены. |

## 4. Подтверждённые проблемы

### P0 — блокеры до production

1. **DDL вызывается при старте backend и доступе к черновикам.** `backend-app/src/server.ts` вызывает `prepareAuth()` при загрузке; `ensureAuthSchema()` создаёт auth/change-set таблицы и выполняет `ALTER TABLE users`. `postgresAdmin.ts::ensureDrafts()` создаёт `cms_drafts` при операциях с overlays. `readShopCategories()` в актуальной ветке выполняет только SELECT — первоначальное утверждение о DDL из публичного GET было ошибочным. Runtime schema bootstrap всё равно требует DDL прав у сервиса и должен быть заменён миграциями. **Статус: подтверждено кодом, кроме снятого утверждения о публичном GET.**

2. **Публикация change set может завершиться частично, но выглядеть успешной.** В `publishChangeSet()` запись со статусом `published` сохраняется до последовательного вызова `publishEntry()` для записей. Ошибка на любой записи оставляет change set опубликованным при неполной публикации. Для публикации Shop product, Article и `writePage()` связанные запросы также выполняются серией без общей транзакции; например, продукт сначала обновляется, затем варианты/галерея. Сбой посередине может оставить смесь старого и нового контента. **Статус: подтверждено кодом.**

3. **Истории клиентов нельзя довести до сайта через CMS.** CMS создаёт/публикует story в `people_stories`, однако публичный API читает только `tire_iq_articles`, а публичные `getPeopleStories()`/`getPeopleStoryBySlug()` возвращают `[]`/`null`. Редакторское подтверждение публикации в этом случае не означает появление истории на сайте. **Статус: подтверждено кодом.**

### P1 — обязательные условия надёжного цикла

4. **Подкатегории Shop — frontend-only функциональность.** CMS вызывает операции подкатегорий, но их нет в backend dispatch client, SQL persistence и публичном API. Связь `subcategoryId` не проходит через backend mapper/публичный тип. Эти элементы нельзя подтвердить как сохранённые/публикуемые; видимость работает в основном локальном клиенте, который не используется browser-клиентом. **Статус: подтверждено кодом.**

5. **Backend errors незаметно превращаются в default или «контента нет».** `fetchPublishedJson()` возвращает `null` на сетевую ошибку и любой не-OK ответ; `getPageContent()` подставляет кодовые defaults, а каталоги — пустые массивы. Нет видимого различения ошибки API, отсутствующей публикации и действительно пустого каталога, а также не найдено логирования/метрики этой деградации на стороне сайта. **Статус: подтверждено кодом.**

6. **Публикация отдельных типов не атомарна и имеет неполную проверку входных данных.** Shop product, material и page publish делают несколько SQL-запросов без транзакции. Admin dispatch принимает динамические имена методов и `unknown[]`; серверные операции проверяют отдельные поля/slug и publication blockers, но полноценной runtime-схемы payload для всех полей на границе API не найдено. **Статус: подтверждено кодом.**

7. **Жизненный цикл S3 объекта не согласован с lifecycle метаданных.** Upload сначала отправляет объект в S3, затем вставляет строку `media`; при ошибке БД объект останется без метаданных. Удаление asset удаляет строку `media`, но `ObjectStore` не имеет Delete, а S3 key не сохраняется в таблице — файл останется в bucket. Проверка использования asset не смотрит на JSON draft overlay `cms_drafts`. Возможны осиротевшие объекты и потеря доступности asset, использованного только в черновике. **Статус: подтверждено кодом.**

8. **Публичный URL нового media требует проверки адресации.** `putMedia()` получает key вида `bizon/media/<uuid>.<ext>`. `buildPublicObjectUrl()` при заданном `S3_PUBLIC_URL` добавляет только этот key; он обходит ветку path-style URL, которая добавляет bucket. Локально `S3_PUBLIC_URL` и `S3_ENDPOINT` указывают на один хост Timeweb. Один существующий URL из таблицы `media` на настроенном публичном host прошёл HTTP HEAD (200, `image/png`), но он мог быть создан другим upload-путём и не доказывает корректность свежего URL из `putMedia()`. Если для новых объектов требуется путь с bucket, сгенерированный URL будет неверным. Дополнительно backend вычисляет `isPrivate`, но upload его не применяет; `PutObject` задаёт только Bucket/Key/Body/ContentType, без ACL. **Статус: риск подтверждён кодом; один текущий объект доступен, upload write-path и URL не проверены.**

9. **Preview CMS по умолчанию указывает на адрес самой CMS.** Корневой `main-app` запускается через `next dev -p 3001`; CMS ветка использует обычный `next dev` и по умолчанию займёт 3000. `catalogPreviewUrl.ts` в CMS ветке также по умолчанию строит preview от `http://localhost:3000`. Следовательно, без явного `NEXT_PUBLIC_SITE_URL` preview ведёт на CMS origin, а не на публичный сайт. Runtime не запускался.

10. **Production адреса и границы сети не установлены.** CMS browser client по умолчанию отправляет запросы на `127.0.0.1:4000`; backend привязывается только к `127.0.0.1` и `::1`. Это подходит только при совместимом размещении/проксировании; отдельные контейнеры или сервисы требуют явного внутреннего маршрута и reachable bind. Production `NEXT_PUBLIC_ADMIN_API_URL`, `CONTENT_API_URL`, публичный site origin, TLS termination, CDN и адрес БД не подтверждены. **Статус: код и локальные адреса подтверждены; production не проверен.**

11. **JSON endpoints не ограничивают размер тела и login-попытки в приложении.** `readJson()` полностью буферизует входной поток без byte limit и используется для login, admin command, lead и cart JSON; media upload имеет отдельный лимит 20 MiB. В backend-коде не найдено login rate limit/lockout. Если ingress публичен, отсутствие внешних ограничений увеличивает риск memory exhaustion и перебора пароля; наличие компенсирующего контроля на proxy/WAF не подтверждено. **Статус: ограничения в приложении подтверждены кодом, внешние контроли неизвестны.**

12. **Категории применения шин теряются на public-read границе.** CMS `TireModelDraft` хранит `applicationCategory` и `applicationTypes`; backend persistence читает/записывает `tire_models_application_types`, а таблица присутствует в локальной БД. Но public read model не выбирает relation table, а `mapTireModel()`/`CmsTireModel` не возвращают ни одно из этих двух полей. Текущие изменения root-сайта добавляют `applicationTypes` в нормализованный тип, а `TireModelStage` строит категории из этих полей; при ответе активного backend они будут пустыми. **Статус: подтверждено кодом; локальные данные production не проверялись.**

### P2 — сопровождение и производительность

13. **Нет доказательств управляемой схемы и восстановления.** В проверенных каталогах не обнаружен версионированный migration workflow для custom backend schema; `CREATE/ALTER` выполняется из runtime кода. Локальная БД содержит `payload_migrations`, но связь этого ledger с таблицами backend/CMS не подтверждена. Backup, PITR, restore drill, retention и RPO/RTO-документация не найдены в проверенном scope. **Статус: не найдено в просмотренных файлах, не доказано отсутствие внешних процедур.**

14. **Наблюдаемость недостаточна для редакторского инцидента.** Публичные DB/API ошибки сводятся к общему 500 или fallback; operation-level tracing, корреляционный ID и алерт на неуспешную публикацию не прослеживаются. В `wrap()` авторы сохранения/публикации всегда `null`; admin direct-publish путь не даёт полноценного журнала автора для каждой сущности. **Статус: подтверждено кодом.**

15. **Операционные README неполны и местами расходятся с кодом.** CMS README утверждает, что backend не подключён, хотя browser client направляет запросы в него. Нужны единые инструкции по пакетам, origins, env-переменным, миграциям, production deployment и первичной учётной записи. **Статус: подтверждено кодом/документацией.**

## 5. Хардкод и конкурирующие источники истины

- Текст главной и Shop landing живёт в `src/lib/content/pages/defaults/*` и объединяется с backend patch. Если API недоступен, посетитель получает defaults, а не явно отмеченную ошибку. Следовательно, текущая реализация не делает CMS единственной точкой редактирования этих страниц.
- Другие страницы имеют локальные fallback-тексты и местами демонстрационные уведомления; CMS меняет только ограниченные hero/SEO поля, не всё содержание страницы.
- Каталог Tire IQ article имеет CMS API, но stories не интегрированы; часть структур каталога остаётся в коде и read model normalizers.
- В Shop редакторский контракт subcategory расходится с backend/public contracts.
- Медиа URL строятся отдельно в `backend-app/src/storage/publicObjectUrl.ts` и `src/lib/storage/publicObjectUrl.ts`; оба разделяют ветки, но их разрешение на фактическом CDN не проверено.
- Корневой README, CMS README, `npm` scripts и preview URL задают несовместимые ожидания для портов и степени подключения.

## 6. Оценка готовности

Числовая оценка из первоначальной версии отчёта снята: часть кода тогда была прочитана из игнорируемых root-копий, а staging/production runtime недоступен для подтверждения. Текущий вывод опирается только на актуальные branch-worktree и публичные GitHub-метаданные. Он достаточен, чтобы не объявлять CMS готовой к production, но недостаточен для итогового score или runtime-сертификации.

| Категория | Статус по доступным доказательствам |
|---|---|
| CMS/backend связь | Блокер по конфигурации: прямой browser API, CORS разрешает только localhost; production origins и reverse proxy неизвестны. |
| Схема и доступы БД | Блокер по коду: runtime DDL в startup и draft access; нет найденных versioned migrations. Production DB grants неизвестны. |
| Публикация | Блокер по коду: pack status записывается до завершения всех entity публикаций; полный набор операций не транзакционен. |
| Контентные контракты | Не завершены: stories и subcategories не имеют подтверждённого полного пути до публичного сайта. |
| Медиа | Реализован upload с лимитом и MIME allowlist; один существующий публичный объект доступен. Новый upload, MIME sniffing, компенсация DB failure, ACL/CDN и restore не подтверждены. |
| Публичное чтение | HTTP errors и отсутствие API сводятся к `null`/пустым результатам в content adapter; runtime-поведение не запускалось. |
| CI | Красный на точном текущем `main-app` SHA: lint прошёл, typecheck упал; тесты и build не были выполнены. |
| Production и восстановление | Невозможно определить: checkout/GitHub не раскрывают внешний хостинг, production origins, backup или restore процедуры. |

## 7. План оптимизации

### P0 — безопасность данных и верный публичный контент

| Результат | Безопасная реализация и критерий завершения |
|---|---|
| Перенести schema bootstrap из backend startup и editor operations в версионированные миграции. | Миграции проходят отдельно до rollout; runtime DB role не имеет DDL; повторный `GET /v1/shop/categories` остаётся чистым read-only запросом и работает с read-only DB role. Проверить на disposable DB до staging. |
| Сделать публикацию атомарной на уровне полного change set. | Все затронутые таблицы и change-set status фиксируются в одной транзакции или через проверяемый outbox/state-machine; искусственный отказ на каждой операции не оставляет частично опубликованный pack. |
| Закрыть путь stories и явно решить судьбу subcategories. | Для каждой оставляемой сущности есть backend CRUD, persistence, published read model, публичный маршрут, mapper и UI; end-to-end тест на каждый путь доказывает видимость именно опубликованной записи. Удаляемые из продукта функции убрать из редакторских контрактов только после отдельного продуктового решения. |
| Валидировать входные данные на серверной границе. | Versioned schemas для каждой команды; некорректные типы, поля, связи, размеры и неизвестные ключи получают стабильный 4xx без изменения БД. |

### P1 — надёжный цикл публикации

| Результат | Критерий завершения |
|---|---|
| Сделать ошибку CMS API наблюдаемой на сайте. | Отделять `not found`, пустой результат и 5xx/network error; логировать route/status/correlation ID без PII; alert на серию отказов; defaults допускаются только по утверждённой политике и имеют явный health state. |
| Согласовать media URL, ACL и удаление с provider. | Успешный upload с проверкой `HEAD/GET` публичного URL; проверено bucket path/addressing; хранится key; есть компенсация при DB failure и lifecycle cleanup; удаление запрещено при references из published и drafts. |
| Зафиксировать deployment map. | Отдельные site/CMS/backend origins, `ADMIN_API_URL`, `CONTENT_API_URL`, TLS/proxy trusted headers, cookie flags и DB connectivity документированы и проверены в staging. Preview ведёт на правильный сайт. |
| Ввести аудит автора/версии. | Для save/publish/hide/delete хранятся actor, timestamp, previous/new revision; параллельные правки выявляют конфликт и не перетирают друг друга без предупреждения. |

### P2 — скорость и сопровождение

| Результат | Критерий завершения |
|---|---|
| Устранить N+1 read запросы каталога и задать лимиты публичных выборок. | Нагрузочная проверка типичной и максимальной выборки; p95 и SQL query count измеряются и укладываются в согласованные SLO. |
| Устранить противоречия в документации. | Единый запуск CMS/site/backend, корректные порты и env examples; в docs разделены local/staging/production и отдельно обозначены опасные действия. |
| Утвердить эксплуатацию БД/S3. | Backup retention, restore drill, object versioning/retention, мониторинг квот и процедуры отката задокументированы и проверены. |

## 8. Целевое состояние и минимальный go-live checklist

Для каждого поддерживаемого типа данных редактор создаёт/меняет запись → получает подтверждённый draft save → запись и media находятся в постоянном хранилище → серверная валидация проходит → публикация атомарно меняет публичную ревизию → сайт загружает ту же ревизию → нужная страница показывает её на desktop/mobile → событие доступно в аудите и при сбое откатывается/восстанавливается.

Перед go-live необходимо подтвердить в изолированном staging:

- Сквозные сценарии для tire direction/model/size, wheel type/model/variant, Shop category/product/variant, home/shop-home/stub page, article и story (если остаётся), media upload/delete, user permission, submit/review/publish/return/cancel.
- Для каждого сценария: save → перезагрузка редактора → чтение draft из БД → публикация → GET public API → публичная страница → мобильный viewport. Черновики/hidden/deleted записи не видны публично.
- Fault injection для отказа БД, S3, каждой стадии публикации, таймаута и повторного запроса; проверить отсутствие ложного published статуса, дубликатов и частичных записей.
- Проверка доступа: editor/admin capability matrix, session expiry/logout, cookie Secure за реальным TLS proxy, rate limiting login/upload, доступ к секретам только backend.
- Мониторинг успешности publish, HTTP 5xx, DB pool saturation, upload failures, broken image URL, API latency и stale/empty catalog; корреляционный ID от интерфейса до SQL/log event.
- Автоматические резервные копии PostgreSQL и media bucket, retention, восстановление в изолированную среду с измеренными RPO/RTO.
- Версионированные schema migrations, staged rollout и rollback plan; runtime service account не имеет DDL прав.
- Проверка всех sitemap/SEO paths, cache/revalidation поведения и фактической задержки обновления после публикации.

## 9. Дополнительные проверки и необходимые доступы

Чтобы повысить статус до production-ready, нужны согласованные read-only сведения о production topology и конфигурации (значения секретов не нужны), доступ к staging CMS и публичному staging сайту, допустимый read-only доступ к staging API/БД schema и возможность загрузить/удалить тестовый asset в отдельном тестовом bucket. Для сквозной записи потребуется отдельная disposable/staging БД и тестовые аккаунты с известными ролями; не использовать production-записи для проверки.

Также необходимы deployment manifests/CI/CD, история миграций, DB backup/restore процедуры, S3 bucket policy/CDN configuration, DNS/TLS/reverse proxy настройки и список поддерживаемых product content types. До получения этих доказательств production-проверка остаётся **не выполнена**.

## 10. Источники кода (основные)

- `backend-app/src/server.ts` — HTTP routes, auth bootstrap, database binding, public API.
- `backend-app/src/admin/server/adminAuth.ts` — auth schema, bootstrap accounts, session cookie.
- `backend-app/src/admin/server/postgresAdmin.ts` — CRUD, drafts, publication, media metadata, change sets.
- `backend-app/src/adminDispatch.ts` — динамический dispatch к backend client.
- `backend-app/src/publishedRead.ts`, `backend-app/src/mapPage.ts`, `backend-app/src/mapShop.ts`, `backend-app/src/mapArticle.ts` — публичная выборка и маппинг.
- `backend-app/src/storage/putMedia.ts`, `backend-app/src/storage/s3ObjectStore.ts`, `backend-app/src/storage/publicObjectUrl.ts` — upload и URL.
- `frontend-cms/src/admin/client/localStore.ts`, `frontend-cms/src/admin/client/adminClient.ts`, `frontend-cms/src/app/api/admin/route.ts` — прямой browser API client и ответ 410; backend proxy в CMS branch не найден.
- `frontend-cms/src/admin/domain/catalogPreviewUrl.ts` — preview origin.
- `src/lib/content/publishedClient.ts`, `src/lib/content/staticCatalog.ts`, `src/lib/content/getPageContent.ts` — site data boundary и fallback.
- `README.md`, `frontend-cms/README.md`, `backend-app/README.md`, `.env.example`, `docker-compose.yml` — локальные инструкции/конфигурация.

