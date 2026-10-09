# Фаза 5C — backend PostgreSQL integration tests

Связанные документы: [аудит CMS](./CMS_TEST_COVERAGE_AUDIT_2026-10-08.md), [архитектура тестов](./CMS_PHASE_03_TEST_ARCHITECTURE_DESIGN.md), [план фазы 5](./CMS_PHASE_05_TEST_REPLACEMENT_PLAN.md). Статус: **план готов; выполнение остановлено до появления канонической schema baseline и подтверждённого disposable DB контура**.

## Цель

Проверить настоящие PostgreSQL запросы backend, независимое перечитывание данных и транзакционные границы на изолированной одноразовой базе. Успешные fake/SQL-string tests не считаются доказательством DB поведения.

## Блокер и safety gate

`backend-app/src/migrations/0001–0008` аддитивны и зависят от базовых таблиц проекта. В репозитории нет канонического полного schema artifact. Текущий dev Compose использует постоянный volume `bizon_pg_data` и контейнер `bizon-postgres`; его нельзя применять как тестовую БД.

До первого DB test необходимы все условия:

1. Версионированный schema-only baseline из утверждённого test/staging source либо отдельно review-нутый canonical baseline SQL без пользовательских строк и секретов.
2. Подтверждённый способ поднять уникальный disposable PostgreSQL instance/database, не переиспользующий Compose volume или неизвестный `DATABASE_URI`.
3. Fail-closed config: только отдельный `CMS_TEST_DATABASE_URL`; отказ до первого SQL write, если host/database не соответствует тестовому allowlist. Нет fallback на `.env`, `.env.local`, обычный backend `DATABASE_URI` или production-переменные.
4. Доказанный cleanup: удаляется только контейнер/database/volume, созданный этим run ID; при ошибке очистки печатается точный ресурс, не выполняется широкий prune.

Пока эти условия не подтверждены, нельзя проектировать команду с `db:migrate`, запускать PostgreSQL, подключаться к существующему сервису, создавать тестовые данные или менять migrations.

## Реализационные задачи после снятия gate

1. Добавить `backend-app/src/testSupport/testDatabaseConfig.ts`: обязательный test URL, allowlist host/database, run ID, отсутствие fallback.
2. Добавить `backend-app/src/testSupport/postgresHarness.ts`: запуск disposable экземпляра, применение утверждённого baseline и зарегистрированных migrations, проверка версии, cleanup только принадлежащего run ID ресурса.
3. Добавить fixture builders по одному пакету: page, catalog model, change set, media. Генерировать уникальные ID/slug и связи; не копировать production data.
4. Добавить DB behavior tests рядом с соответствующими серверами: draft save → новый DB read; role deny → без side effects; submit/review/publish транзакционность; hidden/unpublish → public read API не возвращает запись; конфликтная версия → первый save остаётся в DB.
5. Проверить rollback на искусственном отказе в середине publish и повтор операции без duplicate write.
6. Проверить media deletion history, cleanup queue, object-store fake вызовы и DB rollback на каждой ошибке storage. После реализации unlink (фаза 6) добавить DB тесты удаления всех ссылок; имеющийся unit test проверяет план SQL и преобразование JSON, но не подменяет PostgreSQL integration.
7. Добавить backend CI job отдельным шагом с pinned PostgreSQL image и без secrets. Unit job остаётся независимым; DB job срабатывает только на disposable runner.
8. Каждый write test подтверждает состояние повторным чтением через независимое подключение/dispatch, а не объектом результата `INSERT/UPDATE`.

## Команды и критерии

Точные script names/commands фиксируются после выбора baseline и disposable mechanism. Сначала запускать один harness smoke на пустой disposable DB; затем по одному migration test и behavior test. После каждого write проверять readback; после каждого test run подтверждать, что временная DB удалена и dev Compose не менялся.

Критерии завершения: migrations применены на утверждённой baseline с чистого старта; тесты проходят только на disposable PostgreSQL; повторное чтение независимо подтверждает сохранение; rollback тест показывает отсутствие частичных записей; teardown проверяет уникальный run ownership. Все skip/flaky cases и версия PostgreSQL указаны в отчёте.

## Сейчас выполнено

- Повторно проверены файлы, включая скрытые/игнорируемые (`rg --files -uu`): versioned full-schema dump, Prisma schema и отдельный test DB bootstrap не найдены. Найдены только CMS migrations, отдельный SQL для homepage image и временные worktree snapshots.
- Прочитан корневой `docker-compose.yml`: он закрепляет имя `bizon-postgres`, публикует порт `5433` и подключает постоянный volume `bizon_pg_data`. Этот контур нельзя использовать для интеграционных тестов.
- Проверен поиск конфигурации/документации/CI: отдельные `CMS_TEST_DATABASE_URL`, test database job, schema-only export или test DB bootstrap не обнаружены. Поиск исключал env-файлы и зависимости.
- Блокер подтверждён: backend migrations аддитивны и опираются на базовые таблицы проекта; найденные артефакты не позволяют восстановить каноническую полную схему.
- DB tests, migration commands, Compose, сервисы и `.env` не запускались и не читались.

## Следующий необходимый вход

Для продолжения 5C нужен утверждённый schema-only baseline/test DB bootstrap и выделенный disposable DB механизм. Репозиторий не содержит их, а единственный Compose привязан к постоянной dev-БД. Не следует конструировать baseline из фрагментов миграций: это может дать ложный тестовый контракт. До появления безопасного bootstrap 5C остаётся спланированной, но неисполняемой безопасно.
