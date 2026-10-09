# Архитектура тестирования CMS BIZON — фаза 3

Дата: 2026-10-08  
Основа: статический просмотр пакетов, конфигураций, CI и миграций.  
Статус: **дизайн подготовлен; harness не создан, тесты и сервисы не запускались**.

## 1. Текущая картина

| Пакет | Конфигурация сейчас | CI сейчас | Что это означает |
|---|---|---|---|
| Root public site | Vitest: Node, `src/**/*.test.ts`; Playwright `e2e/`, четыре viewport проекта | `.github/workflows/deploy.yml`: lint, typecheck, unit suite, `build:ci` | Root unit и сборка сайта; Playwright E2E не включён в workflow и CMS не покрывает |
| `frontend-cms` | Vitest: Node, `src/**/*.test.ts`; DOM/browser harness отсутствует | `frontend-cms/.github/workflows/ci.yml`: lint, typecheck, unit tests, production build | UI компоненты не тестируются в DOM; build не проверяет API/DB |
| `backend-app` | Vitest unit; основные DB тесты подменяют `pg`/query | `backend-app/.github/workflows/ci.yml`: typecheck и unit tests | DB integration/API HTTP контур не запускается |

`src/components/shop/forgedView.test.mjs` не покрывается явным include root Vitest (`src/**/*.test.ts`). Фактическая исполняемость не проверена; сначала решить включение/отдельный запуск, не удалять.

`backend-app/src/migrations/index.ts` содержит миграции 0001–0008, но они создают/изменяют CMS-таблицы поверх существующих `users`, `pages`, `media`, `products`, категорий, типов и других базовых таблиц. Поиск файлов проекта не обнаружил `.sql` baseline/schema dump. `docker-compose.yml` использует именованный постоянный volume `bizon_pg_data` и фиксированный контейнер `bizon-postgres`; этот dev Compose не является disposable DB для тестов.

CI сборка публичного сайта использует in-memory HTTP fixture (`scripts/ciBuildApiFixture.js`) — пригодна для сборочного контракта, не для чтения/записи CMS или доказательства содержимого реальной БД.

## 2. Целевая схема проверок

| Уровень | Цель | Контур/фикстура | Допустимое место запуска |
|---|---|---|---|
| Unit/domain | diff, blockers, статусы, capabilities, преобразования и чистые правила | In-memory значения; fake clock только там, где время часть правила | Каждый PR, отдельно в каждом пакете |
| Client/API contract | CMS request body, cookies, статусы/ошибки, backend command response | Локальный mock HTTP server с фиксированными ответами; общие contract cases | Каждый PR без БД и внешнего storage |
| Backend DB integration | настоящие SQL, ограничения, транзакции, round-trip черновика/change set, public filtering, media detachment | Только отдельная одноразовая PostgreSQL DB со schema baseline и уникальным namespace | Выделенный CI job после DB safety gate |
| CMS UI | форма, авторизация, сохранение/перечитывание, конфликт, review flow, предупреждение/индикатор использования файла | Playwright browser context + контролируемый test API/DB fixture | Выделенный CI job; тестовый backend и данные создаются только этой job |
| Public static build | опубликованные данные формируют export, маркер ревизии соответствует снимку | Текущий fixture API расширить контрактом content revision; без публикации в production | CI build contract |
| End-to-end publication smoke | editor save → admin approval → DB/API readback → build/deploy → public DOM показывает версию | Изолированный staging account/DB/storage, уникальная запись и deploy ID | Только staging, ручной или защищённый workflow с отдельным разрешением |

Не следует запускать полную CMS→public staging цепочку на каждом PR: она изменяет внешнее состояние и зависит от deployment provider. В CI PR должны быть детерминированные fake/isolated контуры.

## 3. Изоляция PostgreSQL

### Целевое требование

Интеграционная job получает только `CMS_TEST_DATABASE_URL` и должна завершиться до первого SQL write, если имя базы, host или режим не соответствует выделенному тестовому контуру. Никогда не подставлять production `DATABASE_URI` как fallback. Каждая job создаёт уникальную disposable database/container, применяет подтверждённую baseline schema и migrations, загружает минимальные fixtures, затем уничтожает только созданный ресурс.

### Блокер: базовая схема

Нынешние migration scripts — additive и требуют базовых таблиц/колонок. В репозитории не найден canonical полный schema artifact. Поэтому DB integration нельзя безопасно проектировать до выбора источника baseline.

Порядок решения:

1. Найти утверждённый источник актуальной базовой схемы (например, schema-only dump от изолированного staging/test инстанса; без пользовательских строк и секретов).
2. Зафиксировать версию схемы и проверку происхождения; сверить все предположения migrations/readers.
3. Только затем определить reset/migrate lifecycle для disposable DB.
4. Запретить использование dev `bizon_pg_data` и любого неизвестного подключения.

Если нет безопасного staging источника, отдельный дизайн baseline SQL должен быть согласован и review-нут как миграционная работа; не выводить схему автоматически из непроверенной рабочей БД.

## 4. Storage и внешние сервисы

- Все unit-тесты используют `ObjectStore` fake (в backend уже есть memory fake pattern в `storage/putMedia.test.ts`). Fake умеет регистрировать `put/delete/checkAvailable` вызовы и внедрять отказ на конкретном шаге.
- DB integration проверяет только DB side с fake storage, включая запись cleanup queue и транзакционные границы.
- Отдельная S3 integration допускается лишь при выделенном bucket/prefix, тестовых credentials, строгой cleanup-политике и проверке, что URL принадлежит тестовому endpoint. Удалять разрешено только ключи, созданные текущим run.
- Deployment API в unit/API tests всегда заменять fake adapter; не использовать live token. Deployment smoke только на staging по ручному защищённому workflow.
- CMS tests не должны вызывать `retrySiteDeploy` или публикационный deploy endpoint без подменённого adapter.

## 5. Фикстуры и очистка

- Завести builders по доменным типам: page, tire type/model/variant, wheel type/model/variant, Shop category/subcategory/product, material, media, user, change set.
- Идентификаторы и slugs уникальны по run ID; связи задаются явно; тесты не используют реальные существующие записи.
- Фикстуры состояний покрывают draft, published, archived, open, pending_review, returned, published/cancelled change set.
- Setup проверяет отсутствие ранее созданной сущности с тем же run ID. Teardown удаляет строго ID текущего теста и объекты его namespace. При cleanup error тест помечает остаточный ресурс, не расширяет удаление на весь bucket/таблицу.
- Для повторного чтения API/DB проверки источник чтения должен быть независим от объекта, вернувшегося из write call.

## 6. CMS browser harness

- Создать отдельную Playwright конфигурацию в `frontend-cms`, не смешивать её с root public site E2E.
- Первый слой UI тестов направить на deterministic API fixture: sign-in/session, доступ по ролям, страницы списков/редакторов, network error и empty states.
- Persistence/review tests направить на выделенный backend+PostgreSQL harness после снятия schema blocker; после save делать reload и отдельное API/DB чтение.
- Критические требования: editor draft не виден публично до admin approve; при conflict первая версия сохраняется, второй редактор видит конфликт и не теряет свой ввод; media card показывает usage indicator/предупреждение и удаление универсально снимает ссылки.
- Проверки устойчивы по доступным role/name/label и итоговому состоянию, не через CSS классы или текст исходников.

## 7. CI pipeline по пакетам

1. Root CI: текущие lint/typecheck/unit/build fixture; дополнительно разрешить спор о `.mjs`; public E2E отдельной job после гарантии наличия build artifact и локального сервера.
2. CMS CI: текущие lint/typecheck/unit/build; добавить UI browser job с test API. UI job не использует production auth/storage/deploy secrets.
3. Backend CI: текущие typecheck/unit; DB integration job отдельно на disposable PostgreSQL после baseline schema gate; storage integration отдельно и opt-in.
4. Cross-package contract job: фиксированные payload/error/status contract cases для CMS client ↔ backend dispatch ↔ published API. Точные контракты генерации и совместимости версий — отдельное решение.
5. Staging smoke: не обязательный PR gate, ручной workflow. Отчёт сохраняет test record ID, API response status, DB readback, deploy ID, expected/observed content digest и browser assertion.

Каждый job публикует отдельный итог по пакету: commit SHA, Node/PostgreSQL/browser versions, команды, exit code, skip count, flaky/retry count, trace/log link без секретов.

## 8. Условия готовности дизайна

Готовы: границы пакетов; уровни тестирования; fake storage pattern; разделение deterministic CI и staging; fail-closed правило для БД; уникальные fixtures; отдельный CMS browser harness.

Остаётся блокером: canonical baseline schema для disposable PostgreSQL. Без этого нельзя доказать настоящий SQL/transaction integration и safe round-trip.

Ни один тест, workflow, конфигурация или сервис не был добавлен/запущен в этой фазе. Следующий допустимый артефакт — план фазы 4 по решениям для конкретных тестов-кандидатов. Для реализации harness или тестов потребуется отдельная фаза и разрешение на запуск соответствующих команд.
