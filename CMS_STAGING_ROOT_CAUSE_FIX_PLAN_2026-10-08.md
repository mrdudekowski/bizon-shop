# План устранения неисправностей CMS staging

Дата: 2026-10-08
Статус: расследование завершено; локально исправлены фазы 1–4. Staging, deployment и БД не менялись.

## Цель

Восстановить полный путь материалов Tire IQ: список → редактор → сохранение → публичное чтение → расчёт revision → статическая сборка/проверка сайта. Отдельно восстановить прямое открытие и перезагрузку CMS маршрутов.

## Карта фаз

| Фаза | Область | Результат | Зависимость |
|---|---|---|---|
| 0 | Baseline и deployment identity | Подтверждены schema и deployed commits | Завершена: schema содержит `parent_id`/`order`; screenshot SHAs совпали с backend `5ad3149` и CMS `8ae4427` |
| 1 | Article taxonomy SQL contract | Backend CMS и public queries используют реальные столбцы | Локальный фикс + regression tests; DB integration остаётся после безопасного deploy |
| 2 | Ошибки загрузки/списка в CMS | Ошибка API не маскируется под пустой каталог или вечный spinner | Локально обработаны list/editor load failures и retry; UI tests добавлены |
| 3 | Статические CMS routes | Export создаёт directory routes; материалы используют trailing slash | Локальная конфигурация/ссылки обновлены; build/export smoke ещё требуется |
| 4 | Content revision и публичная сборка | Backend revision, экспортный marker и публичная выдача согласованы | Код backend исправлен; staging/public rebuild verification ожидает выкладку |
| 5 | Сквозной staging smoke | Создание, сохранение, чтение, публикация, сайт и cleanup подтверждены | Фазы 1–4 и согласованный тестовый стенд |

Фаза 5C общей карты остаётся отдельным долгом: интеграционные тесты требуют disposable PostgreSQL с утверждённым baseline schema. Staging DB не использовать как интеграционный стенд.

## Установленные причины и уверенность

### A. Несовпадение SQL backend с реальной схемой article taxonomy — подтверждённый дефект

Staging `information_schema.columns` показывает для `public.tire_iq_articles_taxonomy` поля `id`, `order`, `parent_id`, `value`. Локальные запросы backend используют отсутствующие в этой схеме `_parent_id` и `_order`:

- `backend-app/src/admin/server/postgresAdmin.ts`: list/get материалов и DELETE/INSERT таксономии при публикации.
- `backend-app/src/publishedRead.ts`: `readArticles` и `readArticleBySlug`.

На том же backend наблюдаются `GET /v1/articles` → 500 и `GET /v1/content/revision` → 503 `published_content_unavailable`; другие публичные read API отвечают 200. Snapshot revision включает `readArticles`, поэтому SQL ошибка статей прерывает весь snapshot. Таблица и остальные основные поля статей существуют; гипотеза о полном отсутствии таблицы taxonomy отвергнута.

**Вероятная цепочка воспроизведённого дефекта:** создание статьи вставляет базовую строку успешно; заголовок теста уже имел корректный slug, поэтому отдельный `saveMaterial` пропускается; переход в редактор вызывает `getMaterial`, где subquery обращается к неправильным именам столбцов. Запрос списка использует ту же ошибочную ссылку и падает; `MaterialList.reload()` выполняет `finally`, но не выставляет ошибку, поэтому оператор видит пустое состояние. Публичные статьи и revision падают на том же контракте.

Публичный API скрывает SQL причину общими 500/503. Скриншоты подтвердили, что backend `5ad3149` и CMS `8ae4427` совпадают с HEAD соответствующих checkout; SQL дефект присутствует в deployed backend source. Миграция не нужна: deployed schema уже содержит целевые имена колонок.

### B. Ошибка чтения материала навсегда оставляет spinner — подтверждённый дефект UI

`MaterialEditor` запускает `Promise.all(getSession(), getMaterial(id))` без `catch`/error state. При любой ошибке `record` остаётся `null` и экран бесконечно показывает загрузку. Это воспроизвелось на экспортированном editor route с очищенным QA ID; первоначальная причина совпадает с SQL mismatch из фазы 1.

`MaterialList.reload()` также не обрабатывает rejection. При сбое `listMaterials` состояние остаётся `[]`, после `finally` показывается «Материалов пока нет», то есть ошибка backend неверно представляется как пустая база.

### C. Статический export не совпадает с запрошенными URL — подтверждённый дефект маршрутизации

CMS собирается с `output: "export"`, без `trailingSlash`. Нынешние ссылки используют `/materials` и `/materials/editor?id=…`, а export отдаёт `materials.html` и `materials/editor.html`. Staging отдаёт корректные `.html` файлы, но extensionless URL возвращают `/index.html` (200), включая path с query. По документации Timeweb App Platform SPA Fallback именно так отвечает на несуществующие пути; фактические ответы соответствуют включённому fallback.

Предварительное решение для фазы 3 — включить Next `trailingSlash: true`: при `output: "export"` страницы экспортируются как `materials/index.html` и `materials/editor/index.html`, а ссылки Next ведут на пути со слэшем. Перед staging применением подтвердить форму результата в локальном export и прямыми HTTP smoke checks. Для неизвестного CMS пути отключить SPA Fallback, чтобы не выдавать главную страницу с кодом 200; все необходимые экраны заранее должны существовать в export.

### D. Revision marker не подтверждается — два взаимосвязанных блокера

Backend `/v1/content/revision` отвечает 503. Неверный taxonomy SQL в `readArticles` — непосредственная причина, согласующаяся с кодом snapshot и 500 на `/v1/articles`.

На публичном origin `/content-revision.json` возвращается HTML главной страницы, не JSON. В панели Timeweb подтверждено, что последний public deployment `80a8bb9` завершился ошибкой на шаге `buildWithContentRevision.js`: `Content revision API returned HTTP 503`. Значит, новый экспорт не был собран; текущий live сайт продолжает отдавать предыдущий артефакт. CMS host отдаёт аналогичный HTML fallback, но marker предназначен для публичного сайта.

## План работ по фазам

### Фаза 0 — зафиксировать deployed baseline — завершена

**Цель:** перед изменениями данных или кода убедиться, что фактическая причина относится к deployed backend и CMS.

**Действия:**

1. Сопоставить CMS chunk/API origin и два публичных origin с приложениями/доменами App Platform. Зафиксировать deployment/build ID или commit SHA из панели/лога без чтения секретных переменных.
2. В read-only SQL повторно сверить полный набор столбцов `tire_iq_articles_taxonomy`, необходимые колонки `tire_iq_articles`, миграционный ledger и schema ownership. Не читать содержимое статей.
3. Сравнить deployed backend commit с `backend-app/src/admin/server/postgresAdmin.ts` и `backend-app/src/publishedRead.ts`; установить, какой bundle формирует 500/503.
4. Сохранить исходные статусы: `/v1/articles`, `/v1/content/revision`, `/v1/health`, `/v1/ready`, CMS `.html` и extensionless routes.

**Результат:** screenshot SHA backend `5ad31496de0a1deab9f8ac337dd5da244269fb12` и CMS `8ae4427aa42887592073f250e6922838178200fc` совпали с HEAD. Прочитанные из staging поля taxonomy: `id`, `order`, `parent_id`, `value`.

### Фаза 1 — исправить article taxonomy contract

**Файлы:**

- `backend-app/src/publishedRead.ts`
- `backend-app/src/admin/server/postgresAdmin.ts`
- новые тесты в `backend-app/src/publishedRead.test.ts` и `backend-app/src/admin/server/articleTaxonomy.test.ts` либо эквивалентные файлы по существующим соглашениям.

**Изменения:**

1. В обоих public read запросах читать `taxonomy.parent_id`, сортировать `taxonomy."order"`.
2. В `listMaterials` и `getMaterial` использовать те же фактические поля.
3. В `publishMaterial` удалять дочерние записи по `parent_id`; вставлять `(parent_id, "order", value)`.
4. Не менять `_parent_id`/`_order` в других таблицах: naming различается между существующими схемами.
5. Не добавлять миграцию переименования столбцов: staging уже содержит согласованную legacy схему. Если фаза 0 обнаружит другую schema ownership/другие deployed SQL, остановить этот вариант и принять отдельное решение о миграции.

**Тестовые сценарии:**

- Public read возвращает taxonomy в правильном порядке; запросы содержат только `parent_id` и quoted `"order"`.
- Admin list/get читают существующую статью и таксономию.
- Publish удаляет и повторно создаёт taxonomy rows на правильных полях; повторная публикация не дублирует элементы.
- Revision snapshot завершается при корректной схеме и меняется при изменении опубликованного набора.
- Невалидный/отсутствующий id продолжает возвращать безопасную доменную ошибку.

**Проверки:** `npm test` и `npm run typecheck` из `backend-app`; затем DB integration на disposable baseline DB после разблокировки фазы 5C. Не выполнять миграции или запись в текущий staging для проверки.

**Локальный результат:** public reader и admin list/get/publish используют `parent_id` и quoted `"order"`; backend 44 test files / 197 tests и typecheck прошли до изменений фазы 4; после них точечные SQL/revision tests (14) и typecheck прошли. Disposable PostgreSQL integration и staging readback остаются непроверенными.

### Фаза 2 — явные состояния ошибки материалов

**Файлы:**

- `frontend-cms/src/admin/materials/MaterialList.tsx`
- `frontend-cms/src/admin/materials/MaterialEditor.tsx`
- новые UI тесты `MaterialList.ui.test.tsx` и `MaterialEditor.ui.test.tsx`.

**Изменения:**

1. Развести состояния `loading`, `error`, `empty` и `loaded` в списке. При `listMaterials`/`listAssets` ошибке показать понятное сообщение и повторную загрузку, не показывать empty state.
2. Обработать ошибку `createMaterial`/`saveMaterial` в диалоге создания; не закрывать диалог и не переходить на редактор при неуспешном действии.
3. В редакторе отображать отдельное состояние загрузки, ошибки с кнопкой повторить и загруженную запись. Обрабатывать ошибку `getSession` отдельно от ошибки `getMaterial`; на retry не создавать и не менять запись.
4. Переиспользовать имеющийся `actionErrorText`/каталог ошибок; не показывать SQL, stack trace, hostname с параметрами или иные внутренние детали.

**Тестовые сценарии:** успешная загрузка; timeout/network error; `not_found`; ошибка списка не маскируется под empty; retry переходит в loaded после успешного клиента; ошибка создания сохраняет введённые title/slug и не делает route push.

**Проверки:** CMS `npm test`, `npm run typecheck`, `npm run lint` из `frontend-cms`.

**Локальный результат:** editor/list показывают ошибку с повтором; отказ list не маскируется как empty; create errors остаются видимыми, диалог и введённые данные сохраняются. CMS 29 test files / 116 tests и lint прошли; build/typecheck также прошли. Build сообщает прежние lint warnings в других CMS компонентах и unused `role` в MaterialEditor.

### Фаза 3 — совместимый static export и точные 404

**Файлы:**

- `frontend-cms/next.config.mjs`
- возможно `frontend-cms/src/admin/shell/AdminShell.tsx` и route hrefs, только если локальный export выявит пути без конечного `/` после включения опции.
- документ настройки staging static host.

**Изменения:**

1. Включить `trailingSlash: true` в CMS Next config.
2. Собрать static export с корректной тестовой переменной backend origin и проверить, что `out/materials/index.html` и `out/materials/editor/index.html` созданы; `content-revision.json` к CMS export не добавлять.
3. Проверить все используемые ссылки/`router.push`, чтобы target был `/materials/` и `/materials/editor/?id=…`.
4. В App Platform выключить SPA Fallback для CMS, чтобы неизвестный путь не выдавал root CMS как валидный экран. Перед применением сверить наличие всех маршрутов в export; изменение host settings запускает новый deploy.
5. После отдельного разрешения на staging deployment проверить прямой вход и hard reload каждого CMS route, query param editor ID, существующий путь и неизвестный путь (404).

**Проверки:** build export; локальный статический HTTP сервер с directory index и fallback off; smoke `GET /materials/`, `/materials/editor/?id=article-<id>`, `/unknown/` с ожидаемыми статусами и разными страницами.

**Локальный результат:** добавлен `trailingSlash: true`; материалы, prewarm routes и change set links используют directory URL. Build создал `out/materials/index.html` и `out/materials/editor/index.html`. Неизвестный URL и остальные direct routes нужно проверить на staging после deploy; SPA Fallback пока не менялся.

### Фаза 4 — восстановить revision и публичный build marker

**Файлы:**

- `backend-app/src/contentRevision.ts`
- `backend-app/src/server.ts`
- уже имеющиеся `src/scripts/buildWithContentRevision.js` / build tests — только если baseline показывает дефект в marker pipeline.
- `backend-app/src/deploy/timewebApps.ts` — менять только если end-to-end status validation выявит проблему.

**Изменения и проверки:**

1. Локально проверено: стабильный revision build guard уже имеет tests на стабильный hash, изменение данных между build reads и отказ build. После backend deploy повторить `GET /v1/articles` и `/v1/content/revision` на staging. Ожидать 200, JSON и стабильный `sha256` revision.
2. Проверить, что production/staging public build использует нужный `CONTENT_API_URL` и guard стабильной revision; build fail должен прекращать публикацию, marker не должен создаваться из пустой/частичной fixture.
3. Сверить собранный `out/content-revision.json` со значением до и после сборки.
4. Проверить, что публичный static host отдаёт именно JSON marker по `/content-revision.json`; проверить `Content-Type`, schema, revision и отсутствие SPA index HTML. Настройка fallback не заменяет проверку присутствия артефакта.
5. Добавлен безопасный server-side event `published_content.revision_failed` с классом ошибки и только валидным SQLSTATE, без текста ошибки, SQL и credentials. Его helper покрыт тестами.

**Локальный результат:** диагностический код и tests готовы; public build guard tests прошли (7). Live revision 503 и failed public build зафиксированы в Timeweb. Критерий выхода требует выкладки backend, успешной public rebuild и проверки JSON marker по публичному origin.

### Фаза 5 — staging smoke после фиксов

**Последовательность:**

1. После одобренного обновления backend/CMS сайта сделать read-only preflight API, route, revision и публичной страницы.
2. Создать уникальную статью с title/slug; проверить list, editor, сохранение и независимый readback после reload.
3. Проверить, что draft не виден в public articles endpoint.
4. Опубликовать только эту QA статью (предыдущая пользовательская авторизация покрывает staging test publication); повторно прочитать admin API, public `/v1/articles`, `/v1/articles/:slug` и сайт.
5. Сверить revision API, артефакт `content-revision.json`, deployment ID и публичный DOM/страницу.
6. Удалить только QA запись по точному уникальному ID/title/slug/status, затем подтвердить 0 остаточных строк и отсутствие тестовой статьи в public API. Не удалять файлы и не менять реальные материалы.

**Критерий завершения:** весь путь create → save → reload → publish → revision/build → public display доказан; cleanup подтверждён независимым чтением.

## Порядок релизов и ограничения

1. Сначала backend SQL compatibility и его tests; затем backend staging deployment после отдельного согласования конкретного артефакта.
2. Далее CMS error UX и static export route fix; preview статического export перед host settings/deploy.
3. Затем публичный build/revision marker после появления backend revision 200.
4. В конце staging test record/publish/cleanup по фазе 5.
5. Не изменять staging schema и не запускать production migration: подтверждённая ошибка — несовпадение SQL с уже существующими колонками.
6. Не использовать нынешний staging DB как integration test DB. Разблокировать отдельную фазу 5C через disposable PostgreSQL + schema-only baseline.
7. Не коммитить/пушить и не деплоить без отдельного решения на соответствующей фазе; существующие dirty worktrees сохранить.

## Ссылки на доказательства и документацию

- Исходники: `backend-app/src/admin/server/postgresAdmin.ts`, `backend-app/src/publishedRead.ts`, `backend-app/src/contentRevision.ts`, `backend-app/src/server.ts`, `frontend-cms/src/admin/materials/MaterialList.tsx`, `frontend-cms/src/admin/materials/MaterialEditor.tsx`.
- Runtime/schema наблюдения и статусы: `CMS_TEST_COVERAGE_AUDIT_2026-10-08.md`, дополнения фазы 5D.
- [Timeweb App Platform: SPA Fallback и настройки frontend веб-сервера](https://timeweb.cloud/docs/apps/reverse-proxy).
- [Next.js: trailingSlash и static export](https://nextjs.org/docs/app/api-reference/config/next-config-js/trailingSlash).

## Обновление доказательств после восстановления Front — 2026-10-08

- Front успешно развернут на `917700f`; CMS `Overlord` остаётся на успешном `d1f1ee5`, backend на исправленной версии.
- `/health`, `/ready`, `/v1/articles` и `/v1/content/revision` отвечают 200. Публичный `/content-revision.json` отдаёт schema 1 JSON, revision совпадает с backend (`sha256:32e5d88f84508b6523b69017baf0695973e2088fb88d9976a0cd52fb3918c075`).
- CMS `/materials/` загружает 13 записей. Существующая опубликованная статья `article-10` открывается в редакторе; та же статья читается через public API и визуально отображается на публичном `/tire-iq/quarry-tbr-operating-conditions.html`.
- CMS ID `article-14` отсутствует в текущем списке и правильно показывает ошибку отсутствующей записи с кнопкой повтора; наблюдавшийся ранее бесконечный spinner на этом устаревшем/очищенном ID больше не воспроизводится.
- У публичной статьи extensionless URL попадает в fallback главной страницы; canonical экспортированный `.html` URL отображает корректную страницу. Отдельное исправление public static-host routing осталось открытым.
- Деплой 917700f устранил barrier сборки; в bundle добавлены три ограниченные попытки для transient HTTP/network ошибок. Предыдущие worker-list timeout были проблемой инфраструктуры Timeweb и до `npm run build` не доходили.

## Фаза 8 — привести public static URLs к directory index

**Подтверждённая причина:** public site export не задавал `trailingSlash`; Next генерировал `/tire-iq/<slug>.html`, но Next-ссылки в DOM указывали на `/tire-iq/<slug>`. На Timeweb extensionless запрос возвращал главную страницу из-за SPA Fallback. С `trailingSlash: true` Next экспортирует `/tire-iq/<slug>/index.html` и добавляет slash к ссылкам; CMS с такой конфигурацией уже обслуживает `/materials/`.

**Локальный результат:** `next.config.mjs` изменён и покрыт `staticExportRouting.test.ts` (RED до изменения, GREEN после); typecheck прошёл. `npm run build:ci` успешно завершился в изолированной копии и создал `out/tire-iq/index.html`, `out/tire-iq/ci-fixture-article/index.html`; ссылка/back-link в HTML имеют slash-форму. Local dev возвращает 308 на обе slash-формы и 200 на главную.

**Операционный инцидент тестового прогона:** первый `build:ci` был запущен в основном checkout, пока на localhost:3000 работал Next dev с тем же `.next`. После конфликта dev вернул 500 и manifest стал неполным. Локальный dev восстановлен через `npm run dev:clean`; далее CI export проверен в temp checkout с отдельным `.next`. Текущий localhost root снова 200.

**Остаток:** для проверенных CMS canonical routes не выявлен. Extensionless URL без конечного `/` отвечает HTTP 308 на slash-форму.

**Результат проверки 2026-10-08:** Front был закреплён на старом `72452d1`, хотя исправление уже находилось в `main-app` на `b5440a5`. Выбрали актуальный коммит в настройках и запустили сборку; Timeweb показывает `Успешно b5440a5`. Публичная страница `/tire-iq/` отображает каталог, canonical ссылка открывает правильную статью; оба URL без завершающего `/` отвечают 308 на slash-форму. Публичный JSON marker имеет `Content-Type: application/json`, а его revision совпадает с `GET /v1/content/revision` backend: `sha256:32e5d88f84508b6523b69017baf0695973e2088fb88d9976a0cd52fb3918c075`. Фаза 8 завершена для CMS canonical routes.
