# План устранения разрывов CMS → публичный сайт

> План реализации. Перед началом каждого этапа сверить рабочие изменения и актуальные ветки; не перезаписывать существующие незакоммиченные правки.

**Цель:** обеспечить, чтобы каждое опубликованное значение и каждое медиа, назначенное опубликованному полю в CMS, сохранялось в корректном источнике данных и после публикации отображалось на публичном сайте согласно редакторскому выбору.

**Архитектура:** PostgreSQL — источник истины для CMS-сущностей, черновиков, статусов и связей с медиа; S3-совместимое хранилище — источник байтов изображений. CMS редактирует сущности через backend, публикация формирует опубликованный read model/snapshot, а публичный сайт отображает эти данные без перезаписи редакторского содержимого и незаявленных defaults. Кодовые defaults допустимы только для отсутствующего/не заданного значения, но не должны маскировать опубликованное пустое значение или ошибку публикации.

**Технологии:** `frontend-cms` (Next.js/React), `backend-app` (Node/TypeScript, PostgreSQL, S3 API), root public site (Next.js), существующие unit/UI/API/DB/E2E наборы.

**Основа:** read-only production audit от 2026-10-22, CMS E2E audit от 2026-10-21, локальная копия боевой БД считается пользователем актуальной и становится канонической базой аудита данных. Перед выполнением план сверить с фактической схемой и состоянием копии.

## Неизменяемые продуктовые правила

1. Текст, CTA, порядок, видимость и назначенные изображения, которые CMS успешно сохраняет и публикует, должны совпадать с публичным сайтом после обновления страницы и получения опубликованной версии.
2. Файл, загруженный в медиатеку, становится доступным для выбора в CMS, но **не появляется сам по себе на сайте**. На сайте отображается только медиа, назначенное конкретному полю/сущности и вошедшее в опубликованный read model. Неиспользуемый файл должен быть виден в библиотеке с явным статусом «не используется».
3. Выбор изображения, сохранение draft, публикация и публичная доставка — разные состояния. Успешный toast или HTTP 200 сам по себе не подтверждает следующие состояния.
4. Явное пустое значение опубликованного поля нельзя незаметно заменять старым/демо default. Отсутствующее значение и намеренно пустое значение должны различаться в контракте.
5. Категории автоматически следуют опубликованному списку категорий на витрине. Настройки карточек и настройки шагов карусели остаются разными проекциями: новая категория не обязана становиться шагом карусели, если редактор отдельно не включил её в карусель.
6. Исправления вносятся в правила и контракты, а не отдельными хардкодами значений для конкретных текущих записей.
7. Production БД, S3 и деплой не являются средой для разработки. Все записывающие проверки выполняются только на disposable локальном/изолированном staging окружении.

## Известные расхождения аудита и конечное поведение

| Зона | Подтверждённое расхождение | Требуемое поведение |
|---|---|---|
| Главная / Hero | CMS публикует «Шины для ваших задач», frontend заменяет «ваших» на «больших» | Отображать строку ровно из опубликованного CMS-поля; стилизация не меняет текст |
| Главная / Hero image | В опубликованном snapshot нет привязанного изображения; сайт показывает кодовый `/images/hero/backdrop.jpg` | Привязка из CMS проходит DB → snapshot → URL/asset → фактический `<img>`/background; при намеренно пустом поле — согласованное пустое состояние без подмены |
| Главная / CTA и metrics | CMS сохраняет primary/secondary CTA и metrics; public Hero выводит hardcoded CTA только на мобильном, на desktop CTA отсутствуют. CTA старого `/selection`/`#solutions` переходит в `/models`; после подтверждения владельца retired wording «подбор» также заменяется на «Открыть каталог» | CTA и metrics имеют однозначное публичное применение; старый route и label не создают обещание снятого подборщика |
| Главная / секции | `directions.eyebrow`, часть `shopCampaign` copy и `expertise.imageUrl` не читаются текущими компонентами; `branding` snapshot не потребляется HomePage | Для каждого редактируемого поля: отображать значение либо убрать/переопределить поле как недоступное для редактирования; не оставлять ложные контролы |
| `/shop/` | Hero image отсутствует в snapshot и берётся из defaults; пустой `vehicles.slides` заменяется пятью кодовыми слайдами, хотя CMS позволяет удалить их все | CMS-поля отображаются; пустой список остаётся пустым после публикации, если так определён контракт, а defaults используются только для старых записей, где поле отсутствует |
| Статьи | У 13 опубликованных материалов отсутствует `imageUrl`; карточки используют кодовые обложки | Поддерживаемая CMS featured image сохраняется, публикуется и используется в карточке/статье. Не назначенные материалы не должны получать ложную редакторскую связь из fallback |
| Медиатека | В текущем production CMS отсутствует выбор из галереи; относительные `/images/...` на CMS origin отвечают HTML | Все поля назначения предлагают безопасный выбор существующего доступного asset; preview и public resolver используют согласованный URL-контракт |
| Загрузка медиа | Проверка только сигнатуры допускает усечённый PNG. Предыдущий audit сообщал о 16-byte `test.png`, но в актуальной копии `default_db` сейчас 0 media rows с `filesize=16`; старый объект не считать текущим активным дефектом без повторной сверки | Полная декодируемость проверяется до успешной регистрации; DB metadata и S3 bytes согласованы; ошибка не сообщает ложный успех |
| Shop categories | Принятое правило — новые категории следуют списку категорий; отдельные карточки/карусель могут иметь overrides | Новый опубликованный category появляется в карточном списке автоматически; порядок/видимость/картинка карусели управляются по отдельным правилам без потери category |
| Контент и товарные данные | В актуальной локальной копии маркер «Редакционный перевод» найден в 8 feature rows у 3 опубликованных шинных моделей и в 58 rows у 20 черновиков. Copy кампании о «кованой стали» не совпадает с API material «Кованый алюминий» у всех 4 опубликованных дисков | Публичные тексты проходят редакционную проверку; фактические свойства не противоречат каталожным данным. Данные исправляются в источнике истины после сверки с владельцем контента |
| Варианты DSR188 | Две опубликованные строки `12.00R20` имеют разные SKU и `load_index_dual` 183/153. Selector подписывал обе одним `variant.size` | Selector показывает различающий параметр `LI dual`; данные и размер остаются без изменений |
| Наличие шинного варианта | CMS сохраняет и публикует `available`, но публичная таблица шин это значение не показывала | Публичная таблица и мобильные карточки отображают «В наличии» / «Нет в наличии» из published variant |

## Подтверждённая база аудита — локальная копия `bizon`

Пользователь подтвердил, что локальная копия актуальна. Перепроверенный read-only baseline: PostgreSQL 16.14 на `127.0.0.1:5433`; 9 страниц (3 опубликованы), 6 CMS drafts, 0 pending change sets, 47 media records, 5 опубликованных категорий и 5 tile rows, 23 шинные модели (3 опубликованы), 4 опубликованных модели дисков, 13 опубликованных статей, 1 опубликованный Shop product и 3 Shop order steps. В `media` все 47 объектов прочитаны: 37 назначенных декодируются, 10 не используются; точные MIME/размер/checksum несоответствия и повреждённый неиспользуемый ID 46 перечислены в реестре. Ничего в этой копии не менялось.

Повторно подтверждено: у Home Hero, Shop Hero и Shop campaign нет назначенного изображения; 13 статей не имеют `featured_image_id`; опубликованные DSR158/DSR177/DSR188 содержат 8 видимых англоязычных строк с маркером `Редакционный перевод:`; Shop campaign lead «Настоящая кованая сталь…» конфликтует с материалом «Кованый алюминий» у всех четырёх опубликованных моделей дисков. Пять категорий опубликованы и каждая имеет tile row; `pages_shop_vehicles_slides` пуст. DSR188 опубликованные варианты `12.00R20` отличаются SKU и нагрузкой на сдвоенную ось, поэтому не являются автоматическим дублем.

Изолированные записи и публикации выполняются только в `default_db_e2e` и bucket `bizon-cms-e2e-20261021`. Текущие полные suites: root 264/264, backend 247/247, CMS 153/153; typechecks трёх пакетов и E2E TypeScript проходят. Изолированный сквозной набор прошёл 6/6, включая статический публичный build и cleanup. Root lint: 0 errors/20 warnings; CMS lint: 0 errors/18 warnings. Эти результаты не подтверждают production release identity, migration delivery или редакторские решения по существующим текстам/пустым изображениям.

## Review Focus: тестовые и граничные сценарии

1. Различить отсутствие поля в старой записи, явный `null`, пустую строку и пустой массив; проверить каждое состояние по контракту, особенно fallback и удаление последнего слайда.
2. Сохранить draft, перезагрузить редактор в новом запросе/браузерном контексте, затем публиковать и проверить независимый public endpoint и DOM.
3. Проверить права доступа: черновик/скрытая запись не попадает в public API; опубликованная версия обновляется только после публикации.
4. Проверить media replacement/unlink/deletion при ссылке из нескольких сущностей, черновиков, change set и опубликованной версии; не допустить удаления используемого объекта.
5. Проверить загрузку целого PNG/JPEG/WebP, усечённый файл с правильной сигнатурой, несовпадающий MIME/extension, ноль байт, превышение лимита, storage timeout и сбой DB после S3 PUT.
6. Проверить mobile/desktop поведение CTA и медиа, а также отсутствие горизонтального overflow после обновлений разметки.

Каждый пункт Review Focus обязан иметь конкретный regression test в соответствующем этапе ниже.

---

## Этап 0. Зафиксировать каноническое состояние и охват

**Цель:** избежать исправлений не той копии/ветки и получить точный список полей, данных и consumers.

### Действия

1. Снять read-only fingerprint трёх частей: root/public, `backend-app`, `frontend-cms`: branch, HEAD, upstream, изменённые/неотслеживаемые файлы. Не сбрасывать, не переключать и не включать чужие изменения.
2. Зафиксировать локальную актуальную копию БД как baseline: время создания/обновления, DB/schema version, миграционный ledger, число записей по сущностям, ревизию публикации. Не выводить персональные данные и секреты.
3. Проверить схему и связность без записи: CMS entity → draft/published row → media ID → `media` metadata → объект S3 (HEAD/GET, MIME, size, checksum) → опубликованный JSON → public route/component.
4. Создать field registry: для каждого поля из CMS формы указать тип, API request/response, DB column/JSON path, published mapper path, public component, fallback, потребителя и существующий тест.
5. Просканировать все экраны CMS, включая страницы, tire/wheel модели, shop categories/products, materials/articles, media gallery и publication/change-set flow. Сверить поля с публичными route consumers, а не ограничиваться найденными проблемами главной.
6. Для всех опубликованных media references построить read-only отчёт: entity/field, asset ID, stored URL, object existence, MIME/size/decode result, public response, CMS preview response. Отдельно вывести unused, orphaned, broken, duplicate, stale и missing references.
7. Сопоставить текущие локальные изменения с этапами этого плана: что уже частично исправлено, какие тесты добавлены, что ещё не достигло production branch/artifact. Не объявлять правку готовой по факту наличия локального diff.

### Тестовые проверки и gate

- Fixture/DB profile подтверждён read-only запросом на ожидаемые значения и количеством записей; значения не берутся из текущего UI, если UI — предмет проверки.
- Проверка окружения тестов подтверждает, что connection string и S3 endpoint не могут указывать на production.
- Gate 0: невозможность однозначно определить БД, ветку, media origin либо deployment target блокирует все записи/миграции; сам read-only инвентарь продолжается с пометками неизвестного.

**Артефакт:** `content-field-registry.csv` или Markdown-таблица, `media-reconciliation-baseline.md`, baseline revision и список незакрытых доказательств.

## Этап 1. Утвердить data contract и fallback semantics

**Цель:** зафиксировать поведение полей до изменения реализации и ожиданий тестов.

### Решения

1. Описать единый жизненный цикл значения: `editable draft → persisted draft → published record → snapshot/API → UI render`.
2. Для каждого optional media/copy/list поля утвердить три семантики: поле отсутствует (legacy), явно очищено (`null`/empty), заполнено. Нельзя использовать falsy fallback, если он стирает явное удаление.
3. Утвердить media reference contract: внутренний `assetId` — ссылка на библиотечный asset; публичный URL выдаётся backend/public resolver из сохранённой записи; legacy site paths сохраняют поддержку до миграции.
4. Утвердить, что CTA/eyebrow/metrics и прочие показанные в CMS поля либо отображаются на публичной странице, либо удаляются из CMS редактора с явной миграцией данных/документацией.
5. Для article image определить expected surfaces: article card, listing, detail page, SEO/social metadata. Использовать существующее CMS поле `featured_image_id` как каноническую связь, если аудит схемы подтверждает это.
6. Зафиксировать автоследование категориям и независимую семантику carousel selection: новые категории появляются на плитках; шагом карусели становятся только категории, включённые в её правила.
7. Зафиксировать copy rule для товара/колёс с владельцем контента; не превращать текущий спор о материале в технический хардкод.

### Проверки

- Контрактные примеры для legacy missing, explicit empty, normal value, unpublished draft, published content.
- Review каждого поля минимум одним представителем CMS, backend и public rendering; каждый пример имеет expected JSON и expected visible DOM/content.

**Gate 1:** не менять реализацию публичных defaults до утверждения, какой state означает «редактор очистил поле».

## Этап 2. Закрыть media lifecycle в локальном backend + CMS

**Владелец:** backend upload/storage и CMS placement/picker. Реализация отдельным пакетом, без URL migration и UI/content исправлений в этом же изменении.

### Backend

1. Проследить текущий upload handler и `putMedia` транзакционный порядок. Не отвечать success, пока content validation, S3 write и DB metadata persist не завершились.
2. Проверять содержимое полноценным image decoder из уже имеющихся зависимостей, не только magic bytes; валидировать MIME, extension, размер и допустимые размеры по утверждённой политике.
3. При DB failure после storage write выполнять compensating cleanup либо записывать подтверждённое состояние для cleanup/retry; не оставлять usable media row без объекта или тихий orphan.
4. Возвращать устойчивую структуру `assetId`, `mimeType`, `size`, `checksum`, `previewUrl`/resolved URL и понятную ошибку validation/storage. Не возвращать S3 credentials или приватные bucket details в CMS.
5. Проверить идемпотентность/повтор запроса и замену: старая ссылка остаётся рабочей до атомарного успешного replacement.

### CMS media library и picker

1. Использовать один resolver для галереи, всех placement fields, каталогных строк и draft diff; он корректно разрешает абсолютные S3/CDN URL и legacy `/images/...` относительно public-site origin, а не CMS shell origin.
2. Добавить «Выбрать из галереи» во все image placement поля из registry. Picker показывает preview, alt/имя, usage, фильтр доступных/используемых согласно контракту; cancel не меняет выбор.
3. После upload обновлять список из API и выбирать созданный asset через его stable ID; не подменять запись временным object URL после завершения загрузки.
4. Показать разные состояния: uploading, validating, saved, storage error, corrupt/unavailable legacy object. Ошибка metadata save не должна сообщаться как «Загрузка завершена».
5. Проверить layout picker/library на мобильной ширине, keyboard navigation, focus management и overflow; новые Grid/Flex constraints соблюдать из AGENTS.md.

### Regression tests и gate

- Unit: настоящий валидный fixture и контрольные повреждённые fixture; resolver для S3, CDN, `/images`, API media route, неизвестного origin.
- API integration на disposable PostgreSQL + S3-compatible emulator: валидный upload → второй API read → DB row → GET bytes/checksum; испорченный upload → ошибка и нет доступного media row; DB/storage failure → нет ложного success.
- UI: picker доступен во всех полях из registry; выбрать/cancel/reselect; повторный вход; повреждённый legacy preview с диагностируемой ошибкой.
- Regression proof: отключение decoder validation должно провалить truncated fixture; принудительно направить resolver на CMS origin должно провалить URL integration test.
- Gate 2: asset нельзя назначить и опубликовать, если объект отсутствует, не декодируется или metadata не соответствует фактическим bytes.

## Этап 3. Свести media URLs и фактические объекты без потери ссылок

**Цель:** починить найденные относительные preview URL и все несогласованные DB ↔ S3 записи.

### Действия

1. Реализовать read-only reconciliation command на копии БД: каждый asset ID, URL, размер из DB, HEAD/GET size, checksum, decoder result, usage graph.
2. Подготовить dry-run mapping только для известных классов URL. Существующие `/images/premium/...` трактовать как public-site assets, S3 URLs — как object assets; неоднозначные адреса не переписывать автоматически.
3. Для каждого использованного отсутствующего/повреждённого объекта определить source of truth и восстановление из валидного источника; `test.png` не удалять/заменять только по имени. Ранее 16-byte `test.png` отдельно подтвердить по актуальной копии.
4. Предпочесть совместимый resolver перед массовым преобразованием URL. Если контракт требует migration: dry-run с точным count/IDs, backup/rollback, идемпотентная migration и отдельная проверка media usages/drafts/change sets.
5. После применения на disposable копии сравнить graph ссылок до/после; после миграции заново проверить S3 GET и CMS/public preview.

### Проверки и gate

- Реальный GET всех опубликованных referenced images: status, content type, размер и decode, не только HEAD.
- Нулевые неожиданные «used → missing» переходы; все unresolved assets остаются явно перечисленными.
- Gate 3: production data operation не планируется, пока локальная копия не даёт полный dry-run report и проверенный rollback.

## Этап 4. Устранить Hero и все no-op поля главной

**Цель:** добиться паритета каждого поля Home CMS с публичной главной.

### Реализация

1. Удалить преобразование `title.replaceAll("ваших", "больших")`; отображать CMS строку буквально, разрешив только безопасную структурную стилизацию, которая не меняет слова и порядок.
2. Проследить `home.hero.image` от CMS asset ID через write mapper/DB relation/`publishedRead`/snapshot до компонента. Добавить отсутствующую часть цепочки или исправить mapper. Fallback оставить только для legacy отсутствующего значения, различая его с явным удалением.
3. Привести `primaryCta`, `secondaryCta`, metrics к ожидаемым видимым контролам на desktop/mobile. Все href проверяются и реально ведут на URL из CMS; убрать отдельную hardcoded CTA, если она конфликтует с настройкой.
4. Для каждого активного `home.directions`, `home.expertise`, `home.shopCampaign` и `home.branding` из registry провести двойную проверку: поле editable? Если да — должно иметь renderer; если нет — вывести из активного контракта только после инвентаризации существующих значений и решения владельца. `selectionEntry` и `resume` признаны снятой фичей подбора: не восстанавливать UI; сохранить исторические DB-колонки и не публиковать поля.
5. `expertise.imageUrl` не должен игнорироваться в пользу `PREMIUM_MEDIA` константы, если поле остаётся редактируемым. Для каждого изображения проверить alt и декорационный режим.
6. Разделить тесты компонентов и интеграционный snapshot→page test; snapshot не использовать как единственный oracle для ожидаемого текста.

### Tests / acceptance

- Given published title `"Шины для ваших задач"`, rendered DOM содержит точную строку и не содержит подмены.
- Given выбранный Hero asset A, published snapshot содержит его идентификатор/URL, public HTML/CSS использует A; после reload/network GET байты совпадают с asset A.
- Given explicit remove, после публикации изображение отсутствует и не восстанавливается из fallback.
- CTA: оба CMS href и label видны/доступны при desktop/mobile viewport; no-op CTA field невозможен.
- Проверить все поля registry для главной двунаправленно: редактирование → опубликованное API → DOM; публичное значение повторно открывается в CMS без потери.
- Mutation: вернуть старый `replaceAll` / заменить media mapper на default / убрать CTA renderer — каждый тест должен упасть.
- Gate 4: все public Home поля либо синхронизированы, либо поле больше не предлагается редактору как управляемое.

## Этап 5. Исправить `/shop/`, категории, carousel и остальные публичные страницы

### `/shop/` / Shop Home

1. Применить тот же exact-field registry: hero copy/image/CTA, wheels intro, order steps, catalog tiles, vehicles copy/slides.
2. Различать старое поле отсутствует и редактор очистил список. Не восстанавливать five default vehicle slides при explicit published `[]`; для legacy missing применить единственный задокументированный fallback.
3. Проверить все editable slide images и copy через snapshot и browser DOM; remove последнего слайда остаётся удалённым после reload.
4. Проверить catalog.copy на правильной цели `/shop/categories/`; не считать отсутствие этого текста на `/shop/` ошибкой, так как это отдельная страница.

### Автоматическое следование категориям

1. На опубликованном списке категорий строить карточки витрины без обязательной вручную созданной tile row.
2. Сохранять editor overrides (title, image, order, visibility) для существующей категории без дублирования карточек.
3. Удалённая/архивная/черновая категория обрабатывается по контракту и не создаёт публичную ссылку на несуществующий route.
4. Carousel remains separate projection: проверять `carouselVisible` и `carouselImageUrl`; не делать из любой новой category автоматический slide без решения редактора.
5. Открытие CMS editor не создаёт dirty state и не вызывает write только из-за derived category projection; сохранённые overrides не теряются.

### Статьи и каталоги

1. Для articles проверить полный путь `featured_image_id` → mapper/API `imageUrl` → listing card/detail/social metadata; выбранный asset должен быть тем же на всех требуемых поверхностях.
2. Fallback covers маркировать как system fallback и использовать только для отсутствующего legacy field; явное пустое поле не выдаёт hardcoded cover за загруженное CMS фото.
3. Пройти field registry для tires, wheels, categories, products, pages, stubs, articles. Поле, которое можно изменить/опубликовать, должно иметь видимый consumer либо быть удалено/объяснено контрактом.
4. Уточнить duplicate size `12.00R20` в DSR188 на актуальной БД и согласовать модель выбора варианта. Если размер должен быть уникальным, добавить доменную проверку на write/API и корректирующую data migration после сверки записей; если дубли законны из-за другого индекса/параметра, UI должен отображать различающий параметр.

### Tests / acceptance

- Integration matrix: home, shop-home, article, tire, wheel, category, product: save draft → reload → publish → published API → DOM.
- Assert exact title/copy, image identity and URL, CTA href, order/visibility, alt text, empty-state semantics.
- Given new published category without tile override — exactly one category card появляется; given carouselVisible=false — она не становится carousel slide.
- Given empty slides — public DOM has zero slides, not seeded defaults.
- Gate 5: ни одно редактируемое поле из inventory не остаётся no-op или незаметно fallback-masked.

## Этап 6. Исправить подтверждённые содержательные противоречия в актуальной копии БД

**Цель:** исправлять данные в их CMS source of truth, не закрывать симптом CSS или хардкодом.

1. На копии БД найти DSR158 и все записи с маркерами `Редакционный перевод`, `RSS`, англоязычными placeholder fragment. Сверить draft и published versions. Подготовить редакторский список затрагиваемых полей, не менять автоматически.
2. Уточнить с владельцем каталога фактический материал колёс и правильный текст кампании. До подтверждения оставить конфликт как release blocker, не переписывать слово техническим кодом.
3. Исправить записи через поддерживаемый CMS workflow/fixture; подтвердить DB reload, опубликованный API и конечную публичную страницу.
4. Добавить data-quality проверки, выявляющие запрещённые placeholder marker и несогласованность полей с taxonomy/product contract. Правило должно быть поддерживаемым и не блокировать валидный иностранный технический термин без маркера.
5. Проверить status counts моделей (в частности CMS list TBR 23 vs public 3) по статусам/drafts/visibility. Не считать расхождением, если разницу полностью объясняют draft/archived/unpublished semantics; зафиксировать проверяемую выборку без лишних данных.

### Gate 6

- Содержательные изменения не выполнять до редакторского подтверждения, если корректное значение нельзя вывести из каталожного источника.
- Все public material pages из актуальной копии проходят placeholder scan; каждое исключение документировано.

## Этап 7. Выравнять общие правила UI и безопасное поведение CMS

1. Устранить дублированную подпись количества «1 товаров» в списке/редакторе Shop; использовать один проверяемый plural contract либо parity-tested функции без нежелательной cross-app dependency.
2. Решить нормализацию Shop tiles в рамках уже утверждённого auto-follow rule: derived categories не должны автоматически выглядеть как пользовательские несохранённые правки.
3. Проверить dirty state: просмотр/перезагрузка редактора не меняет DB revision/updated_at и не записывает данные; явное сохранение меняет только ожидаемые поля.
4. Повторно проверить auth expiration, 401/403, storage errors и сетевые повторы в отдельном E2E. Не менять TTL в рамках этого плана без отдельной причины.
5. Accessibility/responsive review всех добавленных picker/preview/status controls; существующие layout constraints соблюдаются на 320/390/768/1440 px.

### Tests

- Plural cases: 0, 1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 111, expected сверяется с русской грамматикой независимо от текущих helper outputs.
- Before/after DB revision and `updated_at` for open-only workflow remain identical.
- Keyboard, focus, cancel, upload failure and narrow viewport UI tests.

## Этап 8. Построить тестовый gate, который проверяет реальный продуктовый контракт

### Обязательные слои

1. **Unit/domain:** mapping, presence-vs-empty semantics, image URL contract, validation, data quality, pluralization.
2. **Component/UI:** каждое CMS поле и его фактическое действие; picker, upload, validation errors, dirty state, removal.
3. **API contract:** CMS request → backend response и опубликованный JSON против утверждённой схемы.
4. **PostgreSQL integration:** write/reload/publish/rollback на disposable DB; проверка draft и published records отдельно.
5. **Storage integration:** реальные bytes в изолированном S3-compatible emulator, checksum/size/MIME/readback и compensation.
6. **Browser E2E:** тестовый редактор → upload/select → save → refresh → publish → открыть публичный route в новой browser context → DOM и image bytes.
7. **Artifact smoke:** собранный production-like CMS JS содержит picker; static/public artifact содержит ожидаемую revision; deployed SHA проверяется отдельно.

### Защита от подгонки тестов

Для каждой тестовой правки вести запись `requirement → independent oracle → reproduced old failure → assertion → mutation proof`.

- Не менять expected value по текущему UI/API, если UI/API проверяется.
- До production fix подтвердить, что regression test красный именно из-за воспроизводимого дефекта.
- При изменении теста обосновать, какое неверное предположение было в самом тесте; показать контракт/источник и минимальную правку.
- Не удалять assertion, не ослаблять HTTP status/DOM/value проверки, не заменять реальную DB/storage boundary моками в тесте, который обязан проверять эту boundary.
- Для каждого критического теста провести локальную mutation/inversion: вернуть `replaceAll`, вернуть default при `[]`, сломать media ID mapping, пропустить decoder validation, убрать один CTA renderer. Тест обязан упасть.
- Проверить тестовые credentials/config guard и уникальную изоляцию каждого теста. Никакой fallback при ошибке connection не должен переключать тест на production.
- На любой test failure сначала классифицировать: код, fixture, среда или неверный контракт; сохранять исходный лог и не переписывать тест до классификации.

### Gate 8

Один локальный E2E run из чистого disposable состояния должен подтвердить persistence независимым повторным запросом и фактическое public rendering. Retry не скрывает flaky test; первый отказ остаётся в отчёте.

## Этап 9. Исправить release chain и доказать delivery каждой части

1. Для CMS, backend и public frontend сопоставить repository, branch, commit SHA, build command, env name (без секретов), output artifact, deployment target и domain.
2. Развести deployment identity для CMS и публичного сайта; наличие gallery в локальном source не считается доказательством на CMS domain.
3. Встроить build/revision identity в доступный диагностический endpoint/artifact; public revision уже существующим контрактом сверяется с backend revision.
4. Развернуть candidate commits только в staging, связать deployment manifest с проверенными SHA и выполнить gate 2–8.
5. После согласования релиза выполнить deployment каждого приложения в правильном порядке: backend/schema compatibility → CMS compatible UI → public consumer; только если миграции требуются, сначала backward-compatible deploy, потом migration, потом cleanup в отдельном релизе.
6. После каждого staging/prod deploy выполнить read-only smoke: build SHA, backend health/readiness, published revision, открытие CMS gallery, загрузка тестового asset только в разрешённый тестовый namespace, выбор/сохранение/публикация и визуальная проверка публичного URL.
7. Production запись/загрузка выполняется только с утверждённым тестовым объектом и безопасным cleanup protocol. Не использовать production delete/replace для проверки.
8. Подготовить rollback для кода, схемы и content contract; не выполнять destructive cleanup до подтверждения всех consumers.

### Gate 9

Релиз не считается синхронизированным, если любой компонент неизвестного SHA, published revision расходится, CMS field no-op, image bytes не читаются, или тесты не доказывают save/reload/publish/public DOM.

## Этап 10. Финальная field-by-field повторная проверка

1. Загрузить один новый валидный тестовый asset в isolated staging, назначить его в Hero, сохранить, перезагрузить CMS, опубликовать, открыть public page в чистом контексте и проверить network response + decoded bytes + DOM.
2. Изменить title, CTA, один section field, статью и Shop slide; для каждого записать значение CMS, request/DB, published JSON, public DOM и build/revision SHA.
3. Проверить explicit remove image и удаление последнего slide; убедиться, что после reload empty state не заменился fallback.
4. Проверить новый category auto-follow и отдельно carousel opt-in/out.
5. Сверить каждую строку registry: `pass`, `not applicable` с причиной или блокирующий дефект. Никаких «в целом работает» без field-level доказательства.
6. Приложить отчёт тестов: точные команды, начальный failure, исправление, повторный успех, mutation proof, среда и limits.

## Критерии завершения всей программы

- Нет редактируемых no-op полей и текстовых подмен после публикации.
- Для каждого опубликованного media placement можно проследить asset ID/URL до доступных и декодируемых S3/public bytes; все CMS previews используют правильный origin.
- Все назначенные CMS изображения видны на соответствующей публичной поверхности; unused media не появляются автоматически.
- Save/reload/publish/public rendering доказаны тестами через отдельные границы, не одним mock и не toast.
- Пустое/очищенное значение и legacy missing обрабатываются детерминированно; fallback не маскирует потерю данных.
- Публичный контент проходит каталоговую и редакторскую проверку; источники противоречий разрешены владельцем данных.
- CMS/backend/public deployed SHAs и snapshot revision соответствуют release manifest.
- Все критические assertions доказали способность упасть на соответствующем старом дефекте.

## Порядок и зависимости

1. Этап 0: baseline и текущий локальный DB inventory.
2. Этап 1: контракты; можно параллельно продолжить read-only диагностику deployment.
3. Этап 2: media lifecycle foundation.
4. Этап 3: media reconciliation на disposable копии.
5. Этапы 4 и 5: content consumers и fallback behavior после утверждения contract.
6. Этап 6: редакторские corrections и data-quality gates; спорные тексты ждут владельца контента.
7. Этап 7: общие CMS UX/validation правила.
8. Этап 8: full integration/E2E gate.
9. Этап 9: staging/release chain, затем отдельное согласование production release.
10. Этап 10: field-by-field acceptance report.

Этапы не объединять в один крупный commit: media validation, URL compatibility, public rendering, content corrections и deployments имеют разные rollback boundaries.

## Отдельные согласования, которые план не подразумевает

- Любые изменения production БД/S3, миграции, удаления/замены объектов и публикация production-контента.
- Изменение фактических характеристик продукта или утверждённого маркетингового текста.
- Production deployment и создание/изменение инфраструктуры staging.
- Удаление CMS-полей или устаревших media records при неразрешённых ссылках.

Для каждого такого действия сначала предоставить dry-run/diff, перечень записей/объектов, test evidence и rollback; затем запросить отдельное подтверждение.

## Контрольная точка финального аудита — 2026-10-22

### Подтверждено в этой контрольной точке

- Локальные репозитории root/public, `backend-app` и `frontend-cms` на своих upstream branches; `HEAD...origin/branch` = `0/0` по каждому. Рабочие деревья содержат незакоммиченные изменения и много untracked files; они намеренно не staged/committed/pushed.
- Read-only запрос проверил `bizon` через loopback Docker: PostgreSQL 16.14, migration `202610220014`, 0 оставшихся benefit-маркеров. Отдельная локальная Docker-копия `default_db` была на `202610130010`; после проверенного dump `tmp/default_db-before-cms-migrations.dump` к ней применены миграции `202610220011`–`202610220014`. Постпроверка показала все 14 миграций, обе новые relation tables, `featured_image_configured` и 0 маркеров в опубликованных feature rows и CMS overlays. Никакие production SQL, media, credentials или публикация не менялись.
- Свежий test run: public root 58 suites / 266 tests passed; backend 54 / 249 passed; CMS 36 / 155 passed; E2E TypeScript typecheck passed.
- Свежий isolated CMS-media E2E прошёл 8/8 на `default_db_e2e` + local MinIO; safety gate подтвердил только эту тестовую БД и bucket. Проверены сессии, 17 benefits, shop variant media, Tire IQ cover, wheel type cover, PDF documents, wheel variant specs и полный media lifecycle с public static build и cleanup.
- Root `npm run build:ci` прошёл. CMS production `npm run build` прошёл при `NEXT_PUBLIC_ADMIN_API_URL=http://127.0.0.1:4000`. Root и CMS lint завершились с 0 errors; остались 20 и 18 warnings соответственно. Первый одновременный запуск CMS build/typecheck завершился `ENOENT` внутри `.next`; последовательный повтор отдельно прошёл, значит это была гонка файлов сборки, а не ошибка исходника.
- Изменённые CSS файлы сверены с предоставленными правилами layout: обнаруженные Grid-контейнеры имеют явные колонки; новые media/document layouts ограничивают ширину и shrink. Статическая проверка не заменяет viewport/browser acceptance.
- `home.selectionEntry` и `home.resume` удалены из активных контрактов; legacy CMS storage и overlays очищают эти ключи, DB columns/data сохранены. Старый CTA, ведущий на `/selection`/`#solutions`, получает label «Открыть каталог»; пустое состояние wheel filters больше не предлагает «Запросить подбор», остаётся очистка фильтров.

### Не закрывает полный release gate

- Browser visual/accessibility/overflow acceptance на 320/390/768/1440 px.
- Field-by-field acceptance всех полей CMS на runtime boundary: сохранение → новая сессия/запрос → публикация → published API → реальный public DOM/asset bytes. Нынешний E2E покрывает основные новые media/variant/document пути, но не каждый leaf field и route из реестра.
- Production deployment identities / SHAs / published revision и production backup. UI автоматизация Timeweb в текущем сеансе недоступна (`cua.getState` завершился ошибкой локальной инициализации); production target нельзя подтвердить, поэтому ранее разрешённую операцию обновления production DB не выполнял.
- Решения владельца зафиксированы: материал Shop campaign — кованый алюминий; вместо автоматического подбора остаются только существующие фильтры, при этом форма заявки менеджеру с данными автомобиля сохраняется. Тексты переносить в CMS дословно из текущей публичной версии; после заполнения пустое поле скрывает блок, кодовый fallback не должен возвращать старый текст.
- Для пустых Home Hero/Shop Hero/Shop campaign и 13 article cover placements назначать те же файлы, что уже отображаются на сайте; новые изображения не подбирать и не создавать. Один назначенный JPEG с неверными `.png` metadata/name перезагрузить как JPG и перепривязать. Повреждённый неиспользуемый `test.png` удалять только после проверки ссылок и backup.
- Полный тест восстановления backup выбран как обязательный шаг перед любыми production DB изменениями. Production release остаётся отдельным от Git push: сначала локальные gates и push, затем свежий backup, проверка точной production DB и отдельная публикация.

### Вывод контрольной точки

Локальные unit/integration/build gates проходили, но полный production sync audit и release gate остаются **не завершены**. Решения по текстам, материалу, изображениям и ручной заявке теперь зафиксированы, однако их применение к данным и полная браузерная field-by-field проверка ещё не завершены. Требуется проверить CMS/public DOM и переполнение на 320/390/768/1440 px; подтвердить production DB identity и сделать свежий backup; только затем использовать ранее разрешённую операцию обновления production DB и отдельно подтвердить deployed SHAs и публичный runtime.

## Дополнительная контрольная точка — 2026-10-22, CMS редакционный контент страниц

- Исправлен подтверждённый разрыв `pages.editorial_*`: CMS теперь редактирует список преимуществ, структурированные разделы, уведомление, proof-блок с placement изображения и CTA; backend сохраняет, перечитывает и публикует эти поля. Публичные страницы About, Branding, Supplier, Warranty, Privacy Policy и Delivery & Returns читают те же опубликованные значения. Delivery & Returns использует CMS hero-фото.
- Пустые и удалённые значения не восстанавливают прежние hardcoded секции незаметно. Добавлена совместимая проверка старого overlay: актуальный snapshot с `documents` считает отсутствующие editorial-поля явным снятием, старый overlay без этого признака сохраняет прежнее поведение.
- E2E сначала выявил дефект очистки: после restore старого снимка CMS опубликованная секция оставалась. Добавлено регрессионное покрытие `mergeLegacyPageOverlay`; затем юридический PDF/section lifecycle и полный изолированный CMS-media E2E прошли 8/8. Тест проверяет сохранение/перечитывание раздела, публикацию в public API и полное восстановление исходного снимка.
- Полные локальные наборы после исправления: public 58 suites / 268 tests, backend 54 / 252, CMS 36 / 156. Типы root/backend/CMS/E2E проходят. Root и CMS lint: 0 errors, 20 и 18 warnings. Public `build:ci` и CMS production build успешны. Изолированная база — `default_db_e2e`; production не использовалась.
- Важно: значения расширенных полей не заполнены в канонической локальной `bizon` БД (флаги остаются false), поэтому соответствующие страницы продолжают использовать текущие fallback-тексты. Их заполнение требует переноса/редакторского подтверждения контента; юридические тексты нельзя переписывать без проверки. Это оставляет требование «весь текст загружается через CMS» незавершённым.
- Остальные release blockers: не подтверждены свежий backup/точная production DB и production deployed SHAs; не пройден полный viewport/browser field acceptance; ещё не применены решения по публичным текстам и image placements. Production DB/S3/публикация не изменялись.

## Дополнение после grill-me и проверки backup — 2026-10-23

- Владелец выбрал дословный перенос текущих публичных текстов в CMS; юридические страницы переносить без редактуры и отдельно сверять. Пустое поле CMS скрывает соответствующий блок, legacy fallback не должен подменять пустое значение.
- Для пустых image placements использовать изображения, уже показанные на текущем сайте. Кованый материал в Shop campaign — алюминий. Оставить ручную заявку с данными автомобиля менеджеру; автоматический подбор шин/дисков не возвращать.
- Backup `C:\Users\HP\Documents\default_db_backup` создан клиентом PostgreSQL 18 и имеет формат архива 1.16; старый PostgreSQL 16 restore client не читает такой архив. Архив был успешно восстановлен клиентом PostgreSQL 18 в новую изолированную local DB `backup_restore_validation`: 57 public tables, 496 rows. Исходный архив и production не менялись. Свежесть backup относительно текущего production состояния и точная identity production DB всё ещё требуют проверки перед любыми боевыми миграциями.
- После исправления подписи использования media у tire model (`Шина` → `Модель шины`, в соответствии с `Модель дисков`) новый изолированный CMS-media E2E прошёл 8/8 на `default_db_e2e` + local MinIO. Backend typecheck и `src/storage/mediaReferences.test.ts` (5 tests) прошли. Проверка браузера на четырёх viewport и полное field-by-field сопоставление остаются открытыми.

## Дополнительная контрольная точка — 2026-10-22, удаление контрактов старого подборщика

- По решению владельца старый подборщик шин/дисков не существует; оставить нужно только текущие фильтры каталога. Поэтому старые `selectionVehicleTypes`/`selectionConditions` удалены из tire direction/model CMS drafts, backend admin/public types, read/write/publish queries и public normalization. Запрос контекста заявки `selectionContext` и активный фильтр по осям `selectionAxles` не затронуты.
- Исторические relation tables и строки не удалялись и не мигрировались. Их прежние записи остаются архивными и не публикуются; change-field catalog сохраняет подписи для просмотра старых аудиторских записей.
- Тесты утверждают отсутствие устаревших полей в API/read model. Root/backend/CMS typecheck прошли; полные suites: 58/268, 54/253, 36/156. Lint завершился без ошибок (root 20 предупреждений, CMS 18 предупреждений). Активный поиск не находит старые контракты в backend/CMS, только регрессионные отрицательные проверки и исторический audit catalog.
- Данные/схема БД и production не менялись. Кодовые изменения остаются незакоммиченными; push/deploy не выполнялись.
- Проверка оставшихся упоминаний подтвердила: старый `/selection` уже перенаправляет в `/models`. В wheel-пути есть ручная заявка на проверку совместимости специалистом (`WheelOrderPanel`): клиент указывает автомобиль, менеджер проверяет выбранные диски и отвечает. Владелец подтвердил, что этот сценарий сохраняется; это заявка на консультацию, не снятый автоматический подборщик. Подпись мобильной вкладки «Подбор» относится к каталогу кованых дисков и не менялась.
- Добавлен E2E сценарий загрузки главного фото модели шины через CMS с preview → save/reload → publish → public API → S3 bytes; E2E TypeScript check проходит. Первый запуск выявил только неверный Playwright locator для вкладки с индикатором ошибки, locator исправлен. Повторная проверка пока невозможна: тестовый backend не поднялся, поскольку Docker API вернул 500, а loopback `127.0.0.1:55434` для `default_db_e2e` не принимал соединения. Recovery удаляет только fixture models с префиксом `CMS E2E benefits` и неиспользуемые assets с префиксом `cms-media-e2e-tire-model-`; наличие оставшейся тестовой модели до восстановления Docker не подтверждено. Этот новый сценарий остаётся **непроверенным**; прежний полный набор 8/8 относится к версии до добавления сценария.
