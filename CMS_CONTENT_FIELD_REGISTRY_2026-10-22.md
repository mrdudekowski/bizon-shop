# Реестр связности полей CMS и публичного сайта — 2026-10-22

Это аудит локальной актуальной копии и контрактов трёх приложений. `bizon` подключена через loopback Docker, PostgreSQL 16.14; последний read-only запрос выполнен 2026-10-22 и подтвердил миграцию `202610220014` и отсутствие benefit-маркеров. Production DB/S3 не изменялись. Полный результат проверки байтов каждого media row сохранён в игнорируемом рабочем отчёте `.superpowers/sdd/CMS_FULL_CONTENT_SYNC_FIX_PLAN_2026-10-22/media-reconciliation.json`.

## Состояние данных на копии

| Область | Факт | Значение для синхронизации |
|---|---|---|
| Schema migrations | 14, последняя `202610220014` | Локальная актуальная копия включает shop variant media, CMS document links, article image intent и утверждённые benefit-тексты. |
| Страницы | 9 записей, из них 3 со статусом `published` | 6 CMS drafts; pending change sets отсутствуют. |
| Шины | 23 модели, 3 опубликованы | Не трактовать остальные 20 как потерю синхронизации: проверить их статусы/родительские направления перед выводом. |
| Диски | 4 модели, все 4 опубликованы | API/public mapper существуют. |
| Shop | 5 опубликованных категорий, 1 опубликованный товар | Tile rows и category records — отдельные источники; новая категория автоматически включается по правилам плана. |
| Tire IQ | 13 опубликованных статей | Ни одна из 13 не имеет `featured_image_id`; это состояние данных, не сбой загрузчика. |
| Shop landing collections | 3 order steps, 0 строк в `pages_shop_vehicles_slides`, 0 строк в legacy `pages_shop_category_carousel`, 5 tile rows | Пустые списки должны оставаться пустыми; defaults не доказывают, что CMS содержимое задано. Настройки tile carousel остаются отдельной проекцией. |
| Медиа | 47 строк, 37 имеют ссылки из сущностей/страниц, 10 не используются; URL уникальны | Все 47 были прочитаны, все 37 используемых успешно декодированы. Ни один объект со ссылкой не потерян при GET. |
| Media metadata | `filesize` заполнен у 36/47, SHA-256 у 5/47, declared MIME у 8/47 | Для старых медиа не хватает независимых контрольных данных; upload E2E подтверждает корректную запись для новых assets. |

### Сверка bytes и media references

| Asset | Связь | Результат GET/decode | Вывод |
|---|---|---|---|
| ID 34 `highway-fleet-portrait.png` | Не используется | 126471 bytes, фактически JPEG | Имя/DB MIME `image/png` расходятся с байтами; не удалять и не переназначать автоматически. |
| ID 35 `quarry-haul-truck.png` | Не используется | 282305 bytes, фактически JPEG | То же расхождение; пока не используется сайтом. |
| ID 36 `forged-wheel-workshop.png` | Тип диска | 83459 bytes, фактически JPEG; DB MIME `image/png` | Единственное MIME/extension расхождение среди текущих назначенных изображений. Байт декодируется; CMS metadata остаётся недостоверной. |
| ID 46 `test.png` | Не используется | 16 bytes, sharp decode failure | Подтверждённое повреждённое тестовое медиа; оно не назначено и не объясняет исчезновение фотографий. Удаление не выполнялось. |
| IDs 71–73 | Branding before/after и Expertise | Все три локальных `/images/premium/...` файла существуют и декодируются | Site-relative preview требует public-site origin; единый resolver уже используется в библиотеке и picker. |
| Остальные назначенные assets (33) | Каталог, галереи и Shop | GET успешен, decode успешен, MIME соответствует | В пределах этой read-only проверки storage bytes доступны. |

Главное изображение Hero **не назначено**: `pages.home_hero_image_id IS NULL`; также пусты Hero Shop и изображение Shop campaign. Media library наличие файла не означает привязку к этому полю. Сайт не может показать фотографию, которую поле не ссылается на asset. Пользователь должен назначить нужный файл через CMS и опубликовать страницу; выбор конкретного изображения автоматически не выполнялся.

## Реестр полей и цепочек

Статусы: **Связано** — известная цепочка присутствует и есть regression/integration test; **Проверено частично** — код/тест есть, но текущие данные не демонстрируют заполненное значение; **Не доказано/разрыв** — отсутствует CMS control или public consumer, либо требуется отдельный сценарий данных.

| CMS сущность и поля (полный набор формы) | Persist/API | Published read/model | Публичный consumer | Статус / доказательство |
|---|---|---|---|---|
| `home`: SEO `seoTitle`, `seoDescription` | `pages.seo_*`; admin `/v1/admin/pages/home` | `readHomePatch` → `mapHomePatch` → `mergeHomeContent` | Next metadata + `/` | Проверено частично: поля в форме/API; public metadata route needs separate source-to-response acceptance check. |
| `home.hero`: eyebrow/title/lead; две CTA label+href; metric label/text; image placement+alt | `home_hero_*`, `home_hero_image_id`; CMS `PlacementFields` | `readHomePatch` joins `media.url`; public patch → home merge | `MainHero` | Связано кодом и regression tests: точная строка без переписывания, обе CTA/metric, назначенное изображение и явная очистка. Текущая DB image ID пуст, поэтому заполненное media не проверено данными. |
| `home.directions`: eyebrow/title/lead | `home_directions_*` | `readHomePatch` → `mapHomeShell` → merge | `TireDirectionShowcase` | Связано: public блок отображает eyebrow/title/lead; компонентный тест. |
| `home.expertise`: eyebrow/title/lead, image+alt, CTA | `home_expertise_*`, media FK; CMS image picker + CTA | `readHomePatch` → map → merge | `ExpertiseSupport` | Связано; UI test меняет выбранное media и CTA, backend catalog охватывает image/CTA. ID 73 подтверждён локальным decode. |
| `home.branding`: eyebrow/title/lead, before/after caption+image+alt, CTA | `home_branding_*`, media FKs; CMS controls добавлены в текущем diff | `readHomePatch` → `mapHomePatch.branding` → `mergeHomeContent.branding` | `BrandingCampaign` + `BrandingCompare` | До текущего diff был no-op: public использовал component constants, CMS не давала редактировать. Теперь подключено; UI test покрывает выбор двух media, CTA/caption и сохранение; map/merge/component tests покрывают точные значения и clears. |
| `home.shopCampaign`: eyebrow/title/lead, image+alt, CTA | `home_shop_campaign_*`, media FK | `readHomePatch` → mapper → merge | `ShopCampaign` | Связано; explicit empty/null сохраняются, component test проверяет отображение. DB image ID пуст. |
| `home.selectionEntry` и `home.resume`: старые copy/image/CTA подбора | Исторические `home_selection_entry_*` и `home_resume_*` колонки сохранены в БД; удалены из CMS draft, backend/public types, defaults, merge и admin read | Legacy overlays очищаются при чтении; активного public consumer нет; `/selection` остаётся совместимым переходом к каталогу | Владелец подтвердил отказ от подборщика шин/дисков; доступны только существующие фильтры | **Снято с эксплуатации.** Поля не редактируются и не публикуются; сохранённые DB-значения оставлены как история. |
| `home.branding` и отдельная страница `branding` | Разные поля/ключи в `pages` | Главная читается как patch `home`; `/branding` — stub page | Homepage compare и отдельный route | Не смешивать две сущности: текущий фикс касается Homepage campaign; stub hero и editorial content страницы `/branding` проходят отдельный маршрут. |
| `shop-home`: SEO, hero copy+image+CTA | `pages.shop_*` | `readShopHomePatch` → `mapShopHomePatch` → `mergeShopHomeContent` | `/shop` | Связь кода проверена тестами missing/null/empty; текущий `shop_hero_image_id` пуст, поэтому реальное назначение не доказано. |
| `shop-home.wheelsIntro`: kicker/eyebrow/title/lead | `pages.shop_wheels_intro_*` | shop patch/map/merge | `/shop` intro block | Проверено кодом; включить в final route acceptance. |
| `shop-home.orderSteps[]`: id/title/description | `pages_shop_order_steps` | published query → shop patch/map/merge | `/shop` | Связано кодом, в локальной копии 3 строки; проверить каждую на публичном DOM в Stage 8. |
| `shop-home.categoryCarousel[]`: copy, link, alt, desktop/mobile image | `pages_shop_category_carousel` | public Shop published projection + merge | `/shop` carousel | Legacy list отделена от category tile carousel; локально 0 записей. Нет подтверждения ожидаемого набора слайдов. |
| `shop-home.catalog.copy`: eyebrow/title/lead/sectionTitle | pages/catalog published projection | query → `mapShopHomePatch` → merge | `/shop` catalog section | Связано кодом; component copy проверяется, пустые/отсутствующие значения разделены. |
| `shop-home.catalog.tiles[]`: categoryId/title/visible/sortOrder/carouselVisible/icon/image/carouselImage | `pages_shop_catalog_tiles` и `shop_categories` | `readShopHomePatch` / tile mapper; категории — отдельный read model | `/shop`, `/shop/categories` | Связано: tile/carousel projections разделены; опубликованные 5 категорий и 5 tile rows, авто-следование категорий сохранено. |
| `shop-home.vehicles`: copy/CTA/slides[] | `pages.shop_vehicles_*`, `pages_shop_vehicles_slides` | published query/map/merge | `/shop` vehicle section | Код связан; список пуст на копии, проверить, ожидается ли скрытое состояние. |
| Stub pages: SEO, hero copy/image, legal `documents[]`, editorial features/sections/notice/proof/CTA | `pages` + `cms_document_links` + existing `pages_editorial_*` tables | `PageEditor` → `mapPage`/`writePage` → `readStubPatch` → `ServicePage` or delivery route | about, warranty, branding, supplier, privacy policy, delivery & returns | Previously dormant editorial fields now have CMS controls and public consumers. CMS can add/remove and explicitly clear each block; public pages replace legacy blocks only when corresponding fields are configured. Hero image now also renders on delivery & returns. Isolated E2E verifies section draft reread → publish → public API and restoration alongside PDF upload/bytes. Canonical DB flags remain false and current editorial text still comes from page fallbacks until an editor populates/publishes these fields; this is an outstanding CMS content migration/entry task, not yet full text parity. |
| Tire direction: name/slug/description/shortDescription/sortOrder/showInMenu/mainImage | `tire_types` fields + `cover_image_id` media FK | CMS draft/publish → `publishedRead.readTireTypes` → `mapTireType` | `/models` card image/name/short description; `/models/[direction]` name/description and per-model filters | Основные редактируемые поля связаны. Снятые direction-level `selectionVehicleTypes`/`selectionConditions` исключены из активных CMS/backend/public контрактов и relation queries; архивные DB-таблицы оставлены без изменений. Реальные фильтры остаются на уровне модели и каталога. |
| Tire model: identity, direction, series/brand, copy, tread/model code, applications, sizes/specifications/prices/availability, documents, main image/gallery, features/advantages, menu | `tire_models`, variants/spec fields, relation rows, media FKs | `readTireModelsByType/readTireModel/readTireVariants` → public map | tire list/detail/catalog/menu/filters + technical documents | CMS `features` are intentionally projected from the same feature rows to public `advantages` and rendered on detail page; this is a naming difference, not a no-op. Retired selector metadata `selectionVehicleTypes`/`selectionConditions` has been removed from the admin draft, save/publish writes, and public mapping; historical relation tables/data are preserved. `modelCode` remains internal and is not in the public model contract. A confirmed public no-op was fixed locally: published tire `available` now renders in both responsive technical table/card views; test reproduced absence before the fix. Same-size variant selection now appends differing technical spec labels while retaining variant IDs. Document flow is connected; tire-specific full-stack E2E remains. |
| Wheel type: identity/copy/order/menu/main image | `wheel_types`, media FK | CMS draft/save/publish → `readWheelTypes` → `mapWheelType` | `/shop/wheels/[wheelType]`, including `forged` special page | Подтверждённый no-op закрыт локально: CMS short description отсутствовал в draft/editor/publish SQL, хотя поле возвращалось public mapper; cover image был обязателен в CMS и публиковался API, но generic category page его не показывала. Спецстраница `forged` полностью подменяла имя/описание/cover константами: локальная копия `bizon` содержит для `forged` заполненные name, description, short_description и cover. Добавлены CMS short-description control, backend draft/publish write, public cover/copy на generic и forged routes. Изолированный E2E подтвердил upload → save/reread → publish/reread → public API URL/shortDescription → exact S3 bytes → asset cleanup; component tests подтвердили HTML cover/копи. Live deployment отдельно не проверялся. |
| Wheel model/variants: identity, series/style/material/construction/fitment, short/long copy, menu, mainImage/gallery/documents, full public variant specs | `wheel_models`, `wheel_variants`, `cms_document_links`, media FKs | CMS edit/save/publish → public models/variants API → wheel detail/table | wheel list/detail/variant selector + technical documents | Document flow now round-trips through PDF upload, saved and published snapshots, media usage labels, public models API, and retrievable S3 object in isolated E2E. Deletion removes variants and related documents; test removes S3 asset. Existing wheel variant fields and responsive disclosure remain verified. Current canonical copy has no wheel variants or document links. |
| Shop category: name/slug/description/order/menu/icon/mainImage/carousel[] | `shop_categories`, `shop_category_carousel`, media FKs | `ShopShowcaseEditor` tile projection + category read → public mapper | `/shop`, `/shop/categories`, category navigation | Проверенный контракт: name/slug/description/order/menu и `cover_image_id` читаются опубликованной категорией; tile icon/image/carousel image живут в отдельном tile snapshot, новые категории автоматически входят в tile projection согласно утверждённому правилу; фото применяются публичным `/shop` carousel и `/shop/categories` cards, detail catalog использует name/description без cover по смыслу. `shop_category_carousel` поддерживает одну фото-проекцию; текущая копия имеет 2 legacy rows с пустыми title, а CMS/public consumers caption не используют. Это dormant legacy title, не текущее расхождение содержимого; не добавлять вторую конкурирующую подпись без решения по контракту. |
| Shop product/variant: name/slug/category/subcategory/copy/price/oldPrice/on-request/main image/gallery/variants(color,size,SKU,price,oldPrice,available,image) | `products.old_price`, `products_variants.old_price`, `products`, `products_variants`, новая `products_variants_rels` из migration `202610220011` | admin read/publish → `readShopProducts` → `mapShopProduct/mapShopVariant` | `/shop/[category]`, product detail/cart | Подтверждённый variant image no-op устранён в текущем diff: CMS picker показывает выбор медиа у каждого варианта; draft save/reload сохраняет placement, publish сохраняет media ID + alt/focus/crop relation, public read возвращает URL в variant `images[]`; media usage labels учитывают связь; удаление чернового Shop продукта очищает overlay. Второй no-op закрыт: старые цены товара и вариантов теперь редактируются, проходят change catalog, DB read/publish и public mapper; скидка отображается существующим Shop UI при `oldPrice > price`. Текущая копия локальной DB содержала null для обоих old_price и не имела variant rows, поэтому существующего опубликованного расхождения данных не выявлено. Изолированный E2E проверяет CMS editing → save → admin reread → publish → published reread → public API с фактическими ценами и изображением. E2E использует `default_db_e2e` + local MinIO; canonical DB и production не мигрировались/не менялись. Включение variant media relation в рабочие среды зависит от миграции и релиза backend/CMS/public.
| Tire IQ Article: title/slug/excerpt/content/featured image/menu/order/taxonomy | `tire_iq_articles.featured_image_id` + fields | `readArticles/readArticleBySlug` → article mapper | `/tire-iq`, article detail, SEO/social | CMS editor и public mapping поддерживают featured image; локально 13 published articles, 0 назначенных featured images. Данные need asset assignment only after content owner selects images. |
| Media upload/picker/placements | `media` metadata/S3 bytes; stable asset ID in placement | backend PUT → DB metadata; public read model resolves URL | gallery, all placements, CMS previews, public consumer | Isolated E2E 2/2: upload/select/save/reload/publish/static media GET and cleanup, only `default_db_e2e` + MinIO. Main unresolved baseline: 1 corrupt unused file and legacy MIME/metadata gaps documented above. |

## Приоритетные подтверждённые дальнейшие работы

1. **P1:** завершить leaf-field consumer registry для tire/wheel/products/categories и исправить только доказанные no-op. Shop variant image path реализован в текущем diff; до production он остаётся недоставленным: migration `202610220011`, публикация совместимого backend, CMS и public build должны пройти release gates отдельно.
2. **Закрыто:** dormant selector metadata `selectionVehicleTypes`/`selectionConditions` убрана из активных контрактов, relation queries и сохранения; исторические таблицы и данные сохранены. Существующие фильтры по модели/каталогу остаются активны.
3. **P1:** заполнить через CMS/опубликованный контент расширенные блоки страниц `about`, `warranty`, `branding`, `become-a-supplier`, `privacy-policy`, `shop-delivery-returns`; текущие DB configured flags false, поэтому тексты пока используют прежние page fallbacks. Не подменять юридические тексты без редакторской проверки.
4. `home.selectionEntry` и `home.resume` закрыты как retired selection flow по решению владельца; исторические DB-колонки и значения сохранены.
5. **P2:** управляемо устранить legacy MIME/size/checksum пробелы. Только после независимого content validation; не менять extensions или записи автоматически.
6. **P2:** у неиспользуемого ID 46 отметить библиотечный asset как повреждённый; удалять после отдельного подтверждения владельца/выверки истории, поскольку это необратимый media delete.
7. Назначить выбранные владельцем изображения в Hero, Shop Hero и Shop campaign, затем проверить независимые read после save/publish и public render. Сейчас поля явно пусты.

## Повторная проверка 2026-10-22

- Read-only запрос к локальной `bizon` подтвердил у `home` старые selection/resume значения, включая `resume.title=«Три ответа до предварительной рекомендации»`, CTA `«Подобрать шины»` и href `/selection`. Владелец подтвердил отказ от подборщика шин/дисков: нужны только существующие фильтры. Оба поля исключены из активных CMS/backend/public типов, defaults, draft read/write и published query; legacy overlays очищаются при чтении. DB-колонки и значения оставлены как история.
- `editorial_*_configured` и подфлаги у всех 9 текущих `pages` — `false`; эти расширения не являются причиной текущего отображаемого контента.
- Повторный placeholder scan до migration `202610220014` нашёл маркер в 66 шинных feature rows: 8 строк в 3 опубликованных моделях (`dsr158`, `dsr177`, `dsr188`) и 58 строк в 20 черновых моделях. Владелец контента утвердил нейтральную карту из 17 текстов; migration применена к локальной актуальной копии и disposable E2E clone. Независимый read-only запрос на `bizon` подтвердил последнюю версию `202610220014` и 0 оставшихся маркеров.
- Повторная сверка Shop показала campaign lead «Настоящая кованая сталь…» и material «Кованый алюминий» у всех 4 опубликованных моделей дисков. Это содержательное противоречие между полями/сущностями, которое нельзя исправить догадкой в коде.
- CMS и public site отдельно тестируют русское склонение Shop product count; граничные значения 0, 1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 111 совпадают. Это текущее дублирование функции без воспроизводимого UI дефекта.
- Изменения текущего прохода: selector одинаковых размеров показывает только различающиеся published specs; tire availability выводится в техническую таблицу и карточки. Тесты до исправления падали на фактическом отсутствии вывода и после исправления проходят.

### Редакторский список опубликованных placeholder-текстов

| Модель | Заголовок поля | Сохранённый текст |
|---|---|---|
| DSR158 | Стойкость к разрывам | `Редакционный перевод: RSS, silica and tear-resistant resin improve rubber strength and toughness.` |
| DSR158 | Высокая грузоподъёмность | `Редакционный перевод: Strengthened bead design and improved steel wire strength increase loading performance.` |
| DSR158 | Самоочищение | `Редакционный перевод: Small bulge in the bottom of grooves can effectively pop out stones.` |
| DSR177 | Управляемость | `Редакционный перевод: Groove bottom steps and heat dissipation holes improve grip and driving force.` |
| DSR177 | Высокая грузоподъёмность | `Редакционный перевод: Big block deeper pattern is specially designed for mining road, making the tread more stronger.` |
| DSR188 | Износостойкость | `Редакционный перевод: Anti-wear carbon black and silica make the rubber more wear resistant.` |
| DSR188 | Высокая грузоподъёмность | `Редакционный перевод: High-strength steel cords improve loading capability.` |
| DSR188 | Теплоотвод | `Редакционный перевод: Zig-zag pattern and open shoulder grooves improve steering performance and heat generation control.` |

Исходные строки сохранены как evidence для аудита. Их замена на согласованные описания приведена ниже отдельной картой и будет выполняться только через CMS save/publish/readback.

## Периметр доказательств

- Обычные unit/UI tests и типизация трёх приложений не заменяют production deployment proof.
- E2E проверяет только disposable `default_db_e2e` и локальный MinIO; production data/storage не изменялись.
- Фактическая production revision CMS/public site, build artifact SHA и опубликованный API snapshot SHA остаются отдельным Stage 9 gate.
- Файлы media audit и E2E harness в `.superpowers/sdd/...` находятся в git-ignored области; DB connection strings и credentials в отчёт не включались.

## Дополнительный leaf contract: Shop variant configuration

`products_variants.configuration` присутствовал в локальной схеме и public mapper/configurator, но отсутствовал в CMS draft type/editor/change catalog и backend draft save. Текущий рабочий diff подключает поле `Комплектация` к редактированию, сохранению, независимому повторному чтению и публикации. Duplicate identity — тройка color + size + configuration: одинаковый размер с разными опциями разрешён, полное совпадение блокируется. В локальной копии `bizon` нет Shop variant rows, поэтому это устранение латентного no-op, а не изменение существующей строки. Изолированный E2E проверил public API; каноническая и боевая БД не менялись.

## Согласованный редакторский текст для шинных benefits

Владелец контента согласовал один нейтральный текст на каждый из 17 уникальных заголовков. Миграция `202610220014` заменила все 66 строк с маркером `Редакционный перевод:` по точному заголовку benefit в локальной актуальной копии `bizon` и в disposable E2E-клоне; она сохраняет статусы моделей и обновляет сохранённые tire-model overlays. Дополнительно отдельная Docker-копия `default_db` была проверена на схеме `202610130010`, сохранена в `tmp/default_db-before-cms-migrations.dump`, затем локально доведена до `202610220014`. Постпроверка `bizon` и `default_db` подтвердила 0 маркеров, новые таблицы media/document links и колонку `featured_image_configured`. В `default_db` до миграции найдено 6 маркеров в сохранённых CMS overlays; это отдельный слой данных, не те 58 feature rows в черновых моделях, которые указаны в аудите. Production DB, storage и публикация не менялись; свежесть резервной копии на стороне Timeweb и целевую БД пока не подтвердил.

| Benefit title | Согласованный текст |
|---|---|
| Безопасность | Помогает сохранять контроль над автомобилем в движении. |
| Восстанавливаемость | Каркас шины подходит для восстановления протектора при соблюдении технологии. |
| Высокая грузоподъёмность | Надёжная работа при перевозке тяжёлых грузов. |
| Высокий пробег | Шина рассчитана на длительный срок службы. |
| Износостойкость | Материалы и рисунок протектора помогают замедлить износ. |
| Короткий тормозной путь | Рисунок протектора способствует эффективному торможению. |
| Низкий уровень шума | Снижает шум во время движения и делает поездку комфортнее. |
| Низкое сопротивление качению | Шина тратит меньше энергии на качение. |
| Самоочищение | Рисунок протектора помогает шине очищаться от загрязнений во время движения. |
| Стойкость к порезам | Протектор помогает защитить шину от порезов и сколов. |
| Стойкость к проколам | Помогает избежать проколов и сохранить шину в рабочем состоянии. |
| Стойкость к разрывам | Помогает сохранять целостность шины при нагрузках. |
| Сцепление на мокрой дороге | Помогает сохранять контроль над автомобилем во время дождя. |
| Теплоотвод | Отводит излишнее тепло и помогает шине работать стабильно. |
| Удаление камней | Канавки протектора помогают выводить камни и защищают шину от повреждений. |
| Управляемость | Шина помогает сохранять устойчивость и точность управления. |
| Экономичность | Шина помогает снизить расход топлива. |
