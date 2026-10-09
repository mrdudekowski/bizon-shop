# Аудит покрытия CMS и админки BIZON

Дата: 2026-10-08  
Фаза: read-only аудит и проектирование.  
Объём: корневой публичный сайт `main-app`, `frontend-cms`, `backend-app`.

## 1. Краткий вывод и границы

**Вывод.** В коде есть содержательные unit-проверки бизнес-правил CMS: переходы change set, diff и конкурентность черновика, клиентские разрешения, серверная авторизация, публикация пакета в транзакции, чтение только опубликованных записей, обработка медиа и административный dispatch. Это полезная базовая защита. Полного доказательства работоспособности CMS нет: тесты не проходят сквозной маршрут от экранов редактора через API к реальному PostgreSQL/S3, повторному чтению после перезагрузки и публичному отображению после сборки и выкладки. В `frontend-cms` нет UI/E2E набора; корневые Playwright-тесты проверяют публичный сайт.

**Проведено:** изучены инструкции проекта, маршруты CMS, клиентские и серверные API, схема и миграции, права, публикация, публичное чтение, тестовые файлы и конфигурация. Подсчитано 22 тестовых файла CMS, 42 backend, 35 root `src` и 8 Playwright E2E файлов; подсчёт файлов не равен количеству тестов или гарантий.

**Не проводилось:** тесты, сборки, линтеры, typecheck, миграции, запуск/остановка сервисов, HTTP-запросы, SQL к реальной БД, загрузки и записи в объектное хранилище. Статус тестов — **неизвестен**. Рабочая копия уже была изменена до аудита; все изменения и неотслеживаемые файлы сохранены. Инвентаризация изменений: `README.md`, `package.json`, корневые страницы/стили и тест, новые архитектурные документы/скрипты/тесты, `public/images/**`, `skills-lock.json`, `tmp/**`. Это не результат аудита и не оценка корректности тех изменений.

### Типы свидетельств

- **Код** — статически подтверждённая реализация или наличие тестового исходника.
- **Конфигурация** — команда/область подбора тестов, проверена по manifest/config.
- **Не подтверждено** — выполнение теста, запрос к текущей БД, сохранение, фактическая публикация, deployment или отображение на публичном URL.

## 2. Карта CMS и админки

### Маршруты интерфейса

| Маршрут | Экран / пользовательская задача | Связанные файлы |
|---|---|---|
| `/` | обзор/вход в оболочку админки | `frontend-cms/src/app/page.tsx`, `src/admin/shell/AdminShell.tsx`, `src/admin/auth/LoginScreen.tsx` |
| `/pages`, `/pages/editor` | страницы сайта и редактор страниц | `src/admin/pages/PageList.tsx`, `PageEditor.tsx` |
| `/shop`, `/shop/category-editor`, `/shop/product-editor` | категории, подкатегории, товары, витрина Shop | `src/admin/shop/*` |
| `/tires/directions`, `/tires/directions/editor`, `/tires/editor` | направления и модели шин | `src/admin/tires/*` |
| `/wheels`, `/wheels/types/editor`, `/wheels/editor` | типы и модели дисков | `src/admin/wheels/*` |
| `/materials`, `/materials/editor` | статьи Tire IQ / материалы | `src/admin/materials/*` |
| `/media` | библиотека файлов, выбор и размещение медиа | `src/admin/media/*` |
| `/publications`, `/publications/editor` | очередь, просмотр, публикация/возврат/отмена change set | `src/admin/publications/*` |
| `/users` | пользователи, роли и capabilities | `src/admin/users/UsersScreen.tsx` |

Карта следует дереву `frontend-cms/src/app`; не подтверждает доступность в запущенной сборке. Пользовательские сценарии, видимые из кода: вход и восстановление сессии; просмотр списков и фильтрация; создание/редактирование; сохранение с baseline черновика; изменение статуса; проверка blockers; формирование/ревью change set; публикация, возврат либо отмена; загрузка, выбор, замена и удаление медиа; управление пользователями.

### Сущности и связи

- Шины: `tire_types`/направления → `tire_models` → `tire_variants`, с изображениями, галереей, применяемостью и характеристиками.
- Диски: `wheel_types` → `wheel_models` → `wheel_variants`, изображения/галерея и параметры.
- Shop: `shop_categories` → `shop_subcategories` → `products` → `products_variants`; витринные блоки и карусели ссылаются на категории/медиа.
- Контентные страницы: `pages` с JSON-подобными редакторскими полями и связями для главной, Shop и типовых страниц.
- Материалы Tire IQ: `tire_iq_articles` и taxonomy.
- CMS-состояния: `cms_drafts` хранит сохранённые черновые payload; `cms_change_sets` хранит наборы изменений/ревью; `cms_auth_sessions`, `users.cms_capabilities` и таблицы истории/cleanup для медиа и сброса паролей.
- Файлы: метаданные и ссылки в PostgreSQL (`media` и CMS-таблицы), объекты — через S3-совместимое хранилище.

**Граница модели:** обычные каталожные таблицы также имеют `status`; `cms_drafts` — отдельное черновое представление. Точная семантика для каждого типа документа (что пишется сразу в рабочую таблицу, что остаётся draft, что попадает в change set) различается и требует контрактной проверки по каждой операции.

### Слои и путь данных

`frontend-cms` (Next.js; `src/admin/client/adminClient.ts` и `localStore.ts`) → HTTP вызовы `/v1/admin/*` → `backend-app/src/server.ts` (cookie-сессия, origin, разбор запроса) → `adminDispatch.ts` (проверка метода/прав) → `admin/server/postgresAdmin.ts` и domain-функции → PostgreSQL. Операции с медиа идут через backend storage (`putMedia.ts`, `objectStore.ts`, `s3ObjectStore.ts`) и таблицу `media`.

Публичное чтение проходит из backend `publishedRead.ts` через `/v1/*`; публичный Next.js использует `src/lib/content/publishedClient.ts`, `loadPublished.ts`, `getPageContent.ts`, каталоговые read models и страницу из `src/app/(site)/*`. Репозиторий документирует статическую генерацию сайта: backend-публикация ещё не доказывает обновление уже собранного сайта; публикация может запустить deployment, а подтверждение завершённой сборки и текущей ревизии требует отдельного наблюдения.

### Роли и статусы

В исходниках присутствуют `admin` и `editor` (сопоставление сохранённой роли `content_manager`), capabilities `edit_site_pages`, `create_catalog_items` и действия publish/hide/delete/manage_users/review_queue. UI скрывает/блокирует часть действий (`canEditorPerform`), backend dispatch должен независимо запретить запрещённую команду. Тест `adminDispatch.permissions.test.ts` проверяет широкий набор отказов editor и отсутствие прикладных запросов.

Статусы, найденные в коде: `draft`, `published`, `archived` для контента; change set включает состояния очереди и итоговые состояния (см. `changeSetTransitions.ts`, `publishEntries.ts`). Существуют операции publish/hide/reset и операции публикации пакета. Для каждого типа следует утвердить точный граф переходов и инвариант: опубликованная версия остаётся читаемой, пока новый draft не опубликован; повторная публикация и снятие с публикации отражаются во всех read model.

### Интеграции и внешние зависимости

PostgreSQL (`pg`), S3-compatible storage (`@aws-sdk/client-s3`), backend HTTP-сервер, auth cookie, deployment adapter (`backend-app/src/deploy/timewebApps.ts`), публичный static build, CMS/admin API. Дополнительные внешние каналы, задействованные обычным публичным сайтом, не считать частью CMS без проверки их связи с админскими операциями. Бизнес-правила медиа включают проверку MIME/размера, ссылок, замен и cleanup; надёжность удалений требует согласованного состояния PostgreSQL и object store.

## 3. Инвентаризация тестов и команд

### Команды (по `package.json`)

| Пакет | Unit suite | Прочие команды | Фактическая область по конфигу |
|---|---|---|---|
| Корень / public site | `npm test` → `vitest run` | `npm run test:e2e` → Playwright | Vitest `src/**/*.test.ts`, Node; Playwright `e2e/`, один worker, публичный сайт |
| `frontend-cms` | `npm test` → `vitest run` | lint/typecheck/build есть, но не запускались | Vitest `src/**/*.test.ts`, Node; UI не монтируется в DOM |
| `backend-app` | `npm test` → `vitest run` | `npm run typecheck`; миграция `npm run db:migrate` (не запускалась) | Набор unit-тестов с fake query/pool; отдельная интеграционная конфигурация не обнаружена |

В корне Playwright настроен на уже собранный Next сервер на порту из `PLAYWRIGHT_PORT` (по умолчанию 3100); проекты размеров 390/768/1024/1440. Наличие e2e-файлов не является доказательством, что сайт или браузеры доступны. Эти сценарии не покрывают CMS.

### Классификация и оценка значимых наборов

| Пакет / набор | Уровень и что проверяет | Сильная сторона | Ограничение / доказательство |
|---|---|---|---|
| CMS `domain/changeSetTransitions`, `changeSetGrouping`, `draftDiff`, `publishRules`, `editorPermissions`, `slug`, `catalogSort` | unit бизнес-правил | Изолированные ожидаемые состояния и ограничения | Не доказывает, что экран отправляет правильную команду и backend хранит результат; дубликаты между CMS и backend требуют общей контрактной матрицы, не автоматического удаления |
| CMS `client/localStore`, `remoteRequest`, `actionFeedback` | клиентский unit/contract | Есть проверки сетевых ошибок и baseline черновика | `remoteRequest.test.ts` читает исходный текст и ищет строки (`fs.readFileSync`), поэтому привязан к реализации и не вызывает request-функцию; заменить проверками запроса/ответа, ошибок и аргументов |
| CMS `PageEditor.contract`, `ShopShowcaseEditor.contract`, `pageListPreview` | source/контрактные проверки | Фиксируют некоторые требования формы и предпросмотра | `PageEditor.contract.test.ts` нарезает текст компонента и проверяет отсутствие `categoryCarousel` в двух диапазонах; это не доказывает корректный редактор Showcase. Рассмотреть переписывание на тест модели/DOM или удаление после подтверждения требований |
| CMS `PlacementFields.upload`, `placementGallery`, `mediaMime`, `uploadError`, `hydrateWheelPreviewAssets` | unit функций и ограниченные контракты медиа | Есть логика MIME, выбора/галереи, ошибок и подготовки превью | Не загружает файл до S3, не сверяет метаданные БД и отображение URL; интеграционный тест нужен в изолированном storage |
| Backend `adminAuth`, `loginThrottle`, `adminCors`, `adminDispatch.permissions` | unit/dispatch с подменённым pg | Пароли/сессии/права/origin проверяются на уровне backend; denied-набор проверяет отсутствие прикладных запросов | Моки не подтверждают реальный cookie round-trip, транзакцию auth и схему; проверить allow cases и права по ролям/операциям, включить endpoint HTTP-тест |
| Backend `draftConcurrency`, `draftDiff`, `changeSet*`, `publishEntries`, `publishPackAtomically` | unit/domain с fake DB/pool | Есть конфликтный baseline и атомарный rollback/повтор | Fake transaction подтверждает алгоритм помощника, не PostgreSQL semantics/SQL в рабочем адаптере; добавить isolated Postgres contract |
| Backend `postgresAdmin`-соседние `shopHomeWrite`, `writeTireModelPublishColumns`, `publishImageColumns`, `createAsset`, `cardPreview`, `listTireModelsDirectionId` | unit на SQL параметры/моки | Точечно ловят маппинг и регрессии ранее найденных write paths | Не покрывают полный CRUD всех коллекций; сопоставить каждый метод с контрактной таблицей и DB integration |
| Backend `publishedRead`, `map*`, `schemaReadiness`, `readiness`, `migrationRunner`, `noRuntimeDdl` | unit readers/mappers/schema | `publishedRead` проверяет SQL-фильтр `status='published'`, связи и маппинг | Fake rows не доказывают поведение реальной БД, миграционную совместимость и публичный HTTP response; migration tests частично проверяют SQL-строки, а не применение к схеме |
| Backend `storage/*` | unit storage readiness/upload/reference | Проверяются ошибки и логика ссылок/загрузки | Не подтверждает реальные S3 credentials, запись, чтение/удаление и компенсацию ошибок |
| Root `src/lib/content/*`, `catalog/*` | unit мапперов/read clients/модели | Покрыты публичные данные, опубликованные выборки и доменная логика каталога | Ответы API часто фиктивны; не подтверждён CMS edit → public build path |
| Root `e2e/*.spec.*` | пользовательские сценарии Playwright публичного сайта | Проверяют навигацию, каталог, корзину/контакты и отображение в заданных viewport | Нет CMS маршрутов, авторизации и CMS API; не запускались |

**Настройки отбора:** оба Vitest config (корень и CMS) явно включают `src/**/*.test.ts`, `environment: node`. Поэтому CMS-тесты, в основном импортирующие чистые функции, исполняются без DOM; React screens не тестируются браузерным окружением. В корне есть `src/components/shop/forgedView.test.mjs`, который не попадает под указанный include; безопасно выяснить статус через `vitest list`/отдельную команду только на следующей согласованной фазе. Пока кандидат — проверить и включить/удалить после выяснения назначения, не удалять по одному имени.

## 4. Матрица покрытия

Обозначения пути: **частично по коду** означает, что найдены тестируемые звенья, но полного реального прохода нет. **Полный путь не проверен** — нужны UI→API→хранилище→повторное чтение/публичная сторона.

| Область / сценарий | Риск | Текущие проверки | Недостаток или сомнение | Рекомендуемый уровень проверки | Путь UI→хранилище→обратно | Приоритет |
|---|---|---|---|---|---|---|
| Создание/редактирование сущностей (страницы, шины/диски, Shop, материалы) | потеря/искажение бизнес-данных | CMS правила/diff; backend dispatch и несколько write helpers | Нет сквозного CRUD по каждому типу; map/SQL ошибки и связи не проверяются на БД | unit validation + backend интеграция CRUD по типам + CMS UI smoke | Частично по коду; реальное сохранение не проверено | P1 |
| Сохранить → обновить экран → повторно прочитать | незаметная потеря данных | `localStore`, `draftConcurrency`, выборочные write tests | Нет доказательства чтения сохранённого значения из PostgreSQL после reload; возможны локальный cache и server source различия | API+Postgres integration; browser test с повторной загрузкой и независимым DB/API read | Нет полного пути | P1 |
| Создать/изменить черновик | draft может случайно стать опубликованным или потеряться | `draftDiff`, `draftConcurrency`, `cms_drafts` логика | Требования baseline, пустого draft, раздельности рабочего состояния различаются по сущностям; UI не проверен | contract table по сущностям + integration + браузерный сценарий | Частично: доменная логика; не UI/storage round-trip | P1 |
| Публикация, снятие, повторная публикация | неверная/частичная публикация | `publishRules`, transitions, publish entries/atomic helper, точечные write tests | Не доказан полный набор записей, транзакция настоящего PG, повторяемость и retry в API | Postgres интеграция с failure injection + HTTP API + UI сценарий | Кодовый путь прослежен, реальный commit и повторное чтение не проверены | P1 |
| Черновые и опубликованные данные разделены | draft просочится публично | `publishedRead.test.ts` проверяет published-фильтры | Тесты fake DB; нужно пройти все endpoint/read models (включая вложенные реляции) на реальной схеме | контрактные тесты каждого public endpoint + Postgres fixtures | Частично на SQL-фрагментах | P1 |
| Отображение опубликованного контента на сайте | public остаётся устаревшим/неверным | root `loadPublished`, `getPageContent`, API client unit; public e2e | Нет генерации сайта от записи CMS и проверки фактической deployed страницы/ревизии; static build — отдельная граница | изолированный сценарий publication→API reread→build→HTTP/browser assertion | Нет полного пути | P1 |
| Валидация, API-ошибки, конкурирующие изменения | плохие данные или потеря параллельной правки | domain publish blockers, `draftConcurrency`, `remoteRequest`, body parser | Конфликт проверен помощником; карта validation/error codes не покрыта на каждом endpoint и UI восстановление не доказано | unit schema/domain + API contract negative cases + browser recovery | Частично по коду, API/UI не проверены | P1 |
| Роли, capabilities, запрещённые операции | обход доступа | `editorPermissions` на двух клиентах, backend permission matrix, auth tests | Нужно позитивное allow matrix, admin/editor capability комбинации, unauthenticated HTTP, прямые запросы для каждого класса методов | backend HTTP/API matrix + UI скрытие как дополнительная проверка | Путь до dispatch тестируется моками; сессия и реальная БД не проверены | P1 |
| Связанные данные, загрузка/замена/удаление медиа | осиротевшие ссылки/объекты, исчезновение используемого файла | `mediaReplacement`, `mediaReferences`, upload readiness/put, миграции | Нет полного согласования PG/S3 при сбое каждого шага, подписанный/публичный URL и рендер после обновления | isolated object-store integration + DB integration + CMS browser test | Частично, реальный объект и публичная страница не проверены | P1 |
| Фильтрация, поиск, пагинация, пустые состояния | оператор не находит запись/ошибочно считает каталог пустым | `catalogSort`, `mobileNav`, части query/read tests | Не найдена сквозная UI матрица фильтров/поиска/пустых/ошибочных состояний; пагинация как контракт не подтверждена | unit selectors/query params + CMS browser fixtures | UI путь отсутствует | P2 |
| Ошибка сохранения и восстановление | потеря введённых правок, ложное подтверждение сохранения | `actionFeedback`, `remoteRequest`, uploadError | Нет проверок отказа API в editor, повторной отправки/idempotency, сохранения формы и повторного чтения | API failure contract + UI browser test с отказом и recovery | Частично по helper; не полный путь | P1 |

## 5. Устаревшие, дублирующие и ненадёжные кандидаты

Ни один тест не удалять без запуска и проверки требований. Статический аудит выявил следующие **кандидаты на переписывание/проверку**, а не доказанные мусорные тесты:

| Файл | Наблюдение | Рекомендация |
|---|---|---|
| `frontend-cms/src/admin/client/remoteRequest.test.ts` | читает исходник `localStore.ts` и проверяет включение/отсутствие строк; реальный request не вызывается | Переписать на тестируемый request/client behavior: method/body/cookie, network/HTTP error mapping и baseline аргумент |
| `frontend-cms/src/admin/pages/PageEditor.contract.test.ts` | source slicing проверяет отсутствие `categoryCarousel` в фрагменте PageEditor, но не проверяет, что функция есть в Showcase Editor | Переписать как контракт данных/DOM-поведение обоих экранов; удалить только если продуктовый контракт упразднён |
| `backend-app/src/migrations/{mediaDeletionHistory,mediaObjectMetadata,mediaReplacements,passwordResetHistory,shopCatalogShowcase}.test.ts` | часть проверок содержит поиск SQL-фрагментов | Оставить как быстрые guard tests, дополнить миграционным тестом на поддерживаемой PostgreSQL; не считать достаточной проверкой применимости/отката |
| `src/components/shop/forgedView.test.mjs` | расширение `.mjs` не соответствует текущему root Vitest include `src/**/*.test.ts` | Проверить отдельное назначение и фактическую команду. Включить в согласованный тестовый scope либо удалить при доказанном устаревании; сейчас исполняемость неизвестна |
| `frontend-cms/src/admin/domain/*` и `backend-app/src/admin/domain/*` пары `changeSetTransitions`, `changeSetGrouping`, `draftDiff`, `editorPermissions` | похожие доменные реализации и тесты в разных репозиториях/пакетах | Не объединять механически: сравнить контракт и версии. Добавить parity/contract tests, затем решать, можно ли убрать дубль |

Других тестов, для которых статически доказано, что они бесполезны, не выявлено. Названия и похожесть не основание для удаления.

## 6. Риски P0/P1/P2

### P0

Подтверждённых P0-дефектов в рамках read-only статического исследования **не установлено**. Это не означает отсутствие P0: реальные права, DB writes, ошибки транзакций, storage и deployed site не проверялись.

### P1

1. **Нет сквозного подтверждения сохранения и публикации.** UI/API success может предшествовать проверке БД, deployment может быть асинхронным, сайт статически собирается. Проверить повторным чтением из PostgreSQL/API и публичной страницы по одной ревизии.
2. **Авторизация проверена главным образом fake pg/функциями.** Расширить на HTTP cookie/session, матрицу capabilities и прямые запрещённые запросы; убедиться, что backend обеспечивает права независимо от скрытия кнопок.
3. **Нет изолированной интеграции write paths и конфликтных отказов.** Проверить все основные сущности и публикационный пакет на disposable DB, включая rollback и повтор после ошибки.
4. **Медиа проходит через две системы хранения.** Нет доказательства восстановления согласованности при сбое PG/S3, реальной загрузки, замены/удаления и появления публичного URL.
5. **Набор CMS не проверяет UI в браузере.** Поэтому формы, навигация, сохранение результата после reload, серверная ошибка и пустое состояние не подтверждаются пользовательским сценарием.

### P2

- Конрактная схема admin API повторяется в двух пакетах; дрейф типов/названий команд нужно ловить отдельной сверкой.
- Source-text assertions хрупкие и способны пропустить смысловую регрессию; заменить поведенческими тестами.
- Неясен статус `.test.mjs` корневого файла в Vitest.
- По каждому тестовому пакету отсутствует сохранённый результат именно этого аудита; команды и наличие тестов не являются доказательством прохождения.

## 7. Ограничения и неизвестные требования

- Текущая доступность PostgreSQL, CMS/backend, S3 и deployment provider намеренно не проверялась.
- Не проверены скрытые env/config значения, внешний CI, production/staging и фактические URL; секреты не читались.
- Не проверены реальные DB schema version, качество существующих данных, constraints, backup/restore, миграции на пустой или копии production БД.
- Неизвестны утверждённые правила: какие типы документа публикуются сразу, какие идут через review; должен ли hide сохранять публичную карточку/URL; удаление связанных сущностей; роли и минимальные capabilities для редакторов; поведение двух редакторов при конфликте; целевой SLA обновления статической страницы.
- Не проверено, есть ли обязательные UI сценарии за пределами маршрутов из исходников, включая восстановление пароля/журналы/системную очередь.
- Не запускались существующие тесты, поэтому нет сведений о фактических падениях, skip, flaky, runtime и длительности.

## 8. Предлагаемый pipeline следующей фазы

| Этап | Входные условия | Действия | Доказательства завершения | Блокирующий риск |
|---|---|---|---|---|
| 1. Утвердить карту и матрицу | Этот аудит и актуальная версия трёх checkout | Зафиксировать сущности, сценарии и границы | Согласованная матрица с владельцем требований | Неизвестный объём CMS-функций |
| 2. Уточнить правила draft/publish/access | Владелец CMS доступен для решений | Утвердить граф статусов, роли/capabilities, hide/delete, конкурентность и SLA | Таблица переходов/разрешений с ожидаемыми ответами API | Двусмысленные требования приводят к ложным тестам |
| 3. Подготовить тестовую архитектуру | Этап 2 утверждён | Разделить unit, API contract, disposable PostgreSQL, изолированный S3 и Playwright; задавать уникальные фикстуры/cleanup; секреты через безопасный CI store | Детерминированные команды по пакетам, изоляция и критерии cleanup; подтверждение, что тестовая конфигурация не указывает на рабочую БД | Утечка тестовых записей во внешние системы |
| 4. Разобрать кандидатов | Есть команды фактического запуска и требования | Проверить `.mjs`, source-text тесты и похожие тесты на контракт/coverage; переписать слабые, удалять только доказанно лишнее | Таблица решения по каждому файлу и зелёный соответствующий тест на baseline | Случайное удаление уникальной защиты |
| 5. Закрыть P0/P1 | Disposable dependencies доступны и безопасны | Начать с backend authorization/write/publish/media; затем CMS save/reload/error и public published-only | Отрицательные и позитивные assertions, DB readback, rollback evidence | Невозможность эмулировать реальные S3/deploy контракты |
| 6. Выполнить проверки по уровням | Тестовые данные изолированы | По отдельности unit, contract/API, DB integration, CMS browser, public site browser; результаты отдельно для root/CMS/backend | Логи команд, версии зависимостей, отчёт skip/flaky и точные exit codes | Смешение трёх репозиториев/конфигураций |
| 7. Проверить реальную сохранность и публикацию | Stage/test стенд и одобренная тестовая запись | Создать уникальную запись, сохранить, перечитать после reload и напрямую из DB; опубликовать; перечитать published API; собрать/развернуть тестовую ревизию; проверить публичный URL | Сквозной идентификатор/ревизия в DB/API/build/public DOM и скрин/ответ URL | Async deployment без идентификатора завершённой ревизии |
| 8. Роли, черновики, сбои и восстановление | Утверждённые правила этапа 2 | Проверить admin/editor/capability, неавторизованные запросы, конкурентное сохранение, сбой API/S3 и повтор | Матрицы allow/deny, подтверждение отсутствия лишних записей и корректного повторного чтения | Невозможность безопасно инъецировать отказ |
| 9. Регрессия и остаточный риск | P0/P1 исправлены/покрыты | Повторить пакетные и критические пользовательские сценарии на чистом тестовом окружении; сверить flaky/CI | Итоговые отчёты по каждому пакету и список ограничений | Флейки маскируются retry |
| 10. Критерии завершения и отдельные допуски | Доказательства этапов собраны | Подготовить go/no-go и действия, требующие отдельного допуска | Подписанный отчёт, список остаточных рисков и повторяемый pipeline | Production migration/deploy требует отдельного разрешения и change window |

**Не переходить к реализации тестов/рефакторингу до согласования аудита и pipeline.** Любой тест, создающий записи или файлы, должен работать только с disposable DB и изолированным bucket/prefix.

## 9. Критерии полного подтверждения работы CMS

CMS можно считать проверенной в рамках заявленного scope только когда есть воспроизводимые доказательства для каждой активной сущности и каждой роли:

1. Команда из CMS проходит backend-валидацию и авторизацию; запрещённая операция возвращает ожидаемый отказ и не меняет данные.
2. Создание и редактирование переживают перезагрузку экрана; независимое чтение подтверждает все поля и связи в PostgreSQL.
3. Draft не попадает в публичный read API; опубликованная версия доступна, а hide/unpublish снимает её в соответствии с утверждённой семантикой.
4. Публикационный change set либо полностью фиксируется, либо полностью откатывается; повтор после отказа не создаёт дубликатов.
5. Загрузка/замена/удаление медиа согласована между объектным хранилищем и DB; публичный URL загружается и изображение отображается в нужном блоке после повторного чтения.
6. Публичная страница показывает точно опубликованную ревизию после завершения статической сборки и deployment; подтверждается revision/build ID или иным воспроизводимым идентификатором.
7. Валидационные, сетевые и конфликтные ошибки показываются оператору, черновой ввод не теряется, повтор сохраняет корректный результат.
8. Поиск/фильтры/пустые состояния и основные viewport проверены на репрезентативных фикстурах; сценарии не зависят от порядка или общего состояния БД.
9. Все три пакета имеют независимые команды CI и отчёты; skipped/unstable тесты обозначены, fixture не может случайно обращаться к production.

---

## Приложение: опорные файлы

- CMS маршруты и оболочка: `frontend-cms/src/app/**`, `frontend-cms/src/admin/shell/AdminShell.tsx`.
- Клиентский контракт: `frontend-cms/src/admin/client/adminClient.ts`, `localStore.ts`, `remoteRequest.test.ts`.
- Backend endpoint/auth: `backend-app/src/server.ts`, `adminDispatch.ts`, `admin/server/adminAuth.ts`, `admin/server/postgresAdmin.ts`.
- Доменные правила: `frontend-cms/src/admin/domain/*`, `backend-app/src/admin/domain/*`.
- Схема/миграции: `backend-app/src/migrations/*`, `migrationRunner.ts`, `schemaReadiness.ts`.
- Публичные данные: `backend-app/src/publishedRead.ts`, `src/lib/content/publishedClient.ts`, `loadPublished.ts`, `getPageContent.ts`, `src/app/(site)/**`.
- Тестовая конфигурация: корневой `vitest.config.ts`, `frontend-cms/vitest.config.ts`, `playwright.config.ts`.

## Дополнение после фаз 5A и 5B — 2026-10-08

После исходного read-only снимка пользователь разрешил автономно продолжить тестовое покрытие по фазам. Фаза 5A добавила поведенческие проверки remote client, page preview и root forged view. В фазе 5B настроены DOM tests через jsdom/Testing Library для CMS editor, showcase, media upload/library и publication review. `frontend-cms` suite теперь подтверждён: 27 файлов, 113 тестов; `npm run typecheck` и `npm run lint` прошли. Эти проверки используют in-memory client fixture и не меняют доказательную границу исходного аудита: реальный backend/PostgreSQL/S3/public deploy не проверялся.

Текущие изменения в CMS не затрагивают production behavior. Source contracts PageEditor и Shop showcase заменены UI assertions; media upload layout/focus source test оставлен до browser visual проверки. Просьба о зелёном usage indicator и универсальном unlink для удаляемого файла остаётся отдельной продуктовой реализацией R2-05. UI DOM test подтверждает текущий список usage и disabled delete, но не приписывает продукту ещё отсутствующий indicator/unlink. npm install для тестовых dev dependencies вывел пять high severity advisories в dev dependency tree; автоматическое обновление не запускалось.

## Дополнение: фаза 5C — 2026-10-08

Выполнен повторный read-only поиск по репозиторию (включая скрытые/игнорируемые файлы) и конфигурации CI/docs, без чтения env-файлов и запуска сервисов. Полный versioned schema baseline, schema-only dump, `CMS_TEST_DATABASE_URL` и отдельный test DB bootstrap не обнаружены. Backend migrations 0001–0008 аддитивны и не создают все базовые таблицы проекта. Единственный корневой `docker-compose.yml` закрепляет `bizon-postgres` и постоянный volume `bizon_pg_data`; использовать его для тестов небезопасно. Поэтому PostgreSQL integration tests не добавлялись и не запускались. Для снятия блокера нужен утверждённый schema-only baseline и отдельный disposable PostgreSQL контур. Детали и fail-closed критерии записаны в [плане фазы 5C](./CMS_PHASE_05C_DATABASE_TESTS_PLAN.md).

## Дополнение: фаза 6 — удаление используемого медиа — 2026-10-08

Реализовано по требованию владельца: на карточке используемого файла отображается зелёный светящийся индикатор; предупреждение перед удалением перечисляет места использования; после подтверждения backend в одной serializable transaction очищает прямые ссылки в опубликованных таблицах, удаляет gallery relation rows и рекурсивно очищает media IDs в `cms_drafts` и `cms_change_sets`. Ожидающая замена также отменяется, staged media references очищаются, объект замены удаляется после commit. Локальный CMS store тоже отвязывает вложенные ссылки до удаления asset. История удаления и cleanup queue остаются в той же транзакции; удаление объекта хранилища выполняется после commit.

Поведенческие UI и unit tests проходят. Полные suites: frontend CMS — 27 файлов/114 тестов; backend — 42 файла/191 тест. Typecheck прошёл в обоих пакетах; lint завершился с 0 ошибками и 17 предупреждениями. Настоящий PostgreSQL, транзакционный rollback и S3 не проверены из-за blocker фазы 5C; перед production use это требует database integration на утверждённой disposable baseline. Детали фазы 6 записаны отдельно в [плане реализации](./CMS_PHASE_06_MEDIA_DELETE_PLAN.md).

## Дополнение: фаза 7 — локальный revision guard сборки — 2026-10-08

Root CI build fixture теперь отдаёт валидную revision и запускает production build через `scripts/buildWithContentRevision.js`. Добавлены unit cases для стабильного hash, revision drift и ошибки build; marker создаётся только если revision совпал до и после build. Тесты статуса backend проверяют provider success + marker match/mismatch, pending, invalid public origin и некорректный deployment ID на mock fetch. Root suite — 36 файлов/151 тест, backend — 43 файла/196 тестов; typecheck обоих прошёл. Root lint — 0 ошибок/13 предупреждений. Guarded static export успешно завершил 28 маршрутов и создал корректный `content-revision.json` в отдельной временной копии; основной `out/` не изменялся. Это подтверждает локальный build и provider/client contracts, но не настоящий PostgreSQL snapshot, deployment provider, CDN или публичный DOM; они ждут фаз 5C/5D.

## Дополнение: фаза 5D — staging smoke — 2026-10-08

Пользователь подтвердил, что открытые CMS и БД являются staging, и разрешил создавать/удалять тестовые записи и запускать публикацию. В CMS проверены материалы, очередь согласования, файлы и публичный revision path. При создании уникальной черновой статьи CMS перешла на editor route, который бесконечно показывал «Загружаем данные…»; свежий список материалов оставался пустым. Точечный read-only readback в БД подтвердил созданную тестовую строку со статусом draft. По разрешению пользователя удалена только эта строка с точным ID/title/slug/status; повторный count вернул 0. Тестовая запись не публиковалась.

На видимых карточках используемых файлов есть список мест использования, кнопка «Удалить» отключена, зелёного индикатора нет. Запрос `/content-revision.json` отображает shell приложения вместо JSON marker. Вложенные адреса после прямой загрузки/обновления возвращают главный экран. Таким образом, фазу 5D нельзя считать пройденной: staging UI не позволяет завершить проверку материала, фактическая публичная revision не подтверждается, а media UX расходится с локально реализованным контрактом фаз 6–7. Подробный протокол и план повторного прогона — в [плане фазы 5D](./CMS_PHASE_05D_PUBLICATION_SMOKE_PLAN.md). Фаза 5C по-прежнему требует отдельной disposable PostgreSQL базы и утверждённого schema baseline.



### Диагностика маршрута и загрузки редактора (дополнение 5D)

Повторная проверка текущего staging: прямое открытие `/materials` изменило URL, но визуально оставило экран каталога шин; это подтверждает проблему прямой маршрутизации/rewrites на staging. Адрес, сформированный CMS после создания, `/materials/editor?id=article-14`, также не восстановил корректное состояние редактора.

Сопоставление с локальным исходным кодом:

- `MaterialList.createMaterial()` ждёт `createMaterial`, затем `saveMaterial` для slug и выполняет `router.push()` в editor route. В staging запись была подтверждена в БД, поэтому первый write endpoint сработал.
- `MaterialEditor` ожидает `Promise.all(getSession(), getMaterial(id))`, но цепочка не имеет `catch`/ошибочного состояния. При отклонении любого запроса компонент остаётся на бесконечном `AdminLoading`. Это конкретный дефект наблюдаемости ошибки в исходниках; без ответа staging API нельзя утверждать, какой запрос отклонился.
- Экспорт CMS содержит `out/materials/editor.html`, однако локальный игнорируемый `frontend-cms/out` собран с backend URL `http://127.0.0.1:4000`. Это не подтверждает конфигурацию опубликованного staging build; локальный артефакт нельзя использовать как доказательство адреса backend на staging.
- Статический экспорт не гарантирует, что веб-сервер отдаёт extensionless route (`/materials`) или вложенные editor routes при прямой загрузке. Нужны конфигурация hosting rewrite либо проверка deployment output и фактических HTTP response headers.

Следующий минимальный шаг диагностики на staging — сверить фактический network response `GET /v1/admin/auth/session` и POST метода `getMaterial` для `article-14`, а также текущий CMS deployment commit/build и его публичный `NEXT_PUBLIC_ADMIN_API_URL` (само значение можно сопоставить с origin без чтения секретов). До этих сведений нельзя отличить API/read contract failure от несовместимого frontend build/backend deployment. Тестовую строку удалили; повторно создавать её не требуется для source-level анализа.

Дополнительно проверены доступные workflow: `frontend-cms/.github/workflows/ci.yml` задаёт `NEXT_PUBLIC_ADMIN_API_URL=http://127.0.0.1:4000` только для CI build validation; deployment workflow CMS в checkout отсутствует. Поэтому CI не подтверждает правильность staging backend origin, а источник/параметры опубликованного артефакта остаются вне доступных доказательств. Публикацию не запускали.

### Внешняя проверка опубликованного staging bundle и API

Собраны read-only данные без авторизации/секретов:

- HTML `/materials/editor.html` возвращает 200 и включает CMS JS chunk. В chunk `/_next/static/chunks/209-f941615754614e6b.js` зашит backend origin `https://mrdudekowski-bizon-shop-593a.twc1.net`.
- Ответы backend: `GET /health` — 200 `{"ok":true}`; `GET /ready` — 200 `{"ok":true}`; неавторизованный `GET /v1/admin/auth/session` — ожидаемый 401 `unauthorized`; публичный `GET /v1/content/revision` — 503 `published_content_unavailable`.
- CORS preflight `OPTIONS /v1/admin` с `Origin: https://mrdudekowski-bizon-shop-e454.twc1.net`, POST и `content-type` вернул 204, точный allow-origin, credentials=true. Конфликт CORS для этих двух доменов не воспроизвёлся.
- HTTP маршруты различаются: `/materials.html` и `/materials/editor.html` возвращают свои статические страницы (200); `/materials/`, `/materials/editor?id=article-14` и `/content-revision.json` возвращают HTML главной страницы (200; одинаковая длина 6225 байт). Для открытия и перезагрузки extensionless deep links hosting fallback указывает на главную страницу.
- Открыл точный статический файл `/materials/editor.html?id=article-14` в браузере. После «Проверяем доступ» он воспроизводимо остаётся на «Загружаем данные…». ID уже очищен из staging, поэтому этот прогон подтверждает поведение при ошибке getMaterial для отсутствующего ID, но не первопричину первоначального запроса существующей записи.

Интерпретация: установлены две отдельные проблемы — hosting не маршрутизирует extensionless CMS URL на экспортированные `.html` файлы, а MaterialEditor скрывает ошибку чтения и бесконечно показывает загрузку. CMS → backend CORS и базовая доступность backend подтверждены; проблема не локализована в CORS или падении всего backend. Публичный revision endpoint при этом недоступен. Для причины первоначального сбоя существующего `article-14` нужен конкретный авторизованный ответ `getMaterial`; его нельзя получить без чтения/экспорта session cookie или чувствительных логов, чего не делал.

#### Уточнение по revision marker и публичному origin

CMS bundle содержит отдельный origin `https://mrdudekowski-bizon-shop-931a.twc1.net` для публичных media/preview URL. На этом origin повторно проверены `/content-revision.json` и `/v1/content/revision`: оба URL отдают HTML главной страницы (200, `text/html`, 54240 байт), а не JSON. На CMS host `/content-revision.json` также отдаёт HTML fallback; backend host `/v1/content/revision` отдельно возвращает 503 `published_content_unavailable`. Следовательно, конкретный marker отсутствует/не отдается на публичном host, а backend API не может сформировать актуальную revision. Причина на backend стороне (нет published content, несовместимая схема/конфигурация либо deployment mismatch) по этим публичным ответам не различается.

## Дополнение к фазе 5D — установленный дефект схемы статей и план фиксов

Read-only metadata query в Adminer подтвердил: таблица `public.tire_iq_articles_taxonomy` существует, но её столбцы называются `id`, `parent_id`, `order`, `value`. Локальные запросы `backend-app/src/admin/server/postgresAdmin.ts` и `backend-app/src/publishedRead.ts` ожидают `taxonomy._parent_id`/`taxonomy._order`; material publish также удаляет/вставляет через `_parent_id`/`_order`. Это подтверждённое несовпадение кода с фактической schema. Предыдущее предположение о полном отсутствии relation table было проверено и отвергнуто.

Несовпадение напрямую согласуется с runtime симптомами: `/v1/articles` → 500; `/v1/content/revision` → 503 (snapshot включает чтение статей); список CMS показывает пустое состояние при необработанной ошибке; editor зависает при отклонённом getMaterial. Остальные проверенные публичные коллекции отвечают 200. Чтобы точно связать текущий deployed backend с checkout, до фикса нужно установить его commit/build ID; API скрывает внутреннюю SQL ошибку.

Подготовлен пофазовый план [устранения staging причин](./CMS_STAGING_ROOT_CAUSE_FIX_PLAN_2026-10-08.md): baseline → согласовать article taxonomy SQL с существующими `parent_id`/`"order"` → обработать ошибки CMS → исправить static export routes/SPA fallback → восстановить revision и public build marker → сквозной staging smoke. Код, schema и deployment не менялись.
