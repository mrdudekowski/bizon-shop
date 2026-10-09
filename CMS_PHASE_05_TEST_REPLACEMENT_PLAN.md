# Фаза 5 — план замены слабых тестов и закрытия критических пробелов

Связанные документы: [аудит](./CMS_TEST_COVERAGE_AUDIT_2026-10-08.md), [решения фазы 2](./CMS_PHASE_02_DECISION_LOG.md), [архитектура тестов](./CMS_PHASE_03_TEST_ARCHITECTURE_DESIGN.md), [оценка кандидатов](./CMS_PHASE_04_TEST_CANDIDATES_REVIEW.md). Статус: **5A и ограниченная 5B выполнены; 5C–5D и отдельная реализация R2-05 остаются**.

## Цель

После утверждения требований заменить source-text assertions тестами наблюдаемого поведения и закрыть критичные проверки editor review, conflict, hide, public revision и удаления медиа. Ограничить работу только согласованным списком; не делать общий рефакторинг тестовой инфраструктуры.

## Предлагаемые очереди

### 5A — чистые, изолированные тесты без БД

1. Remote CMS client: управляемый `fetch` seam и проверки credentials/body/baseline/error mapping.
2. Resolver для page card preview: чистые входы страницы и доступных assets.
3. Change set parity cases для R2-01 и R2-03 на фронтовой и серверной domain функциях.
4. Root forged wheel view: сохранить три существующих сценария и включить в реальный CI runner.
5. Удалить или переписать только source-string assertions, для которых новая поведенческая проверка уже запущена и доказала эквивалентную защиту.

### 5B — CMS browser tests с test API

1. Editor changes: save создает open set, submit переводит в pending review, до admin approval public-facing state не меняется.
2. Admin review: approve/return/cancel и повторная отправка; positive/negative roles.
3. Conflict: два browser contexts, stale save получает conflict; ввод второго сохраняется и позволяет перечитать/reapply.
4. Media UI: usage warning, зелёный светящийся статус, список мест; подтверждение удаления.
5. Upload/replace/cancel: progress, ошибка, повтор, preview и галерея.

### 5C — backend + PostgreSQL integration

1. Снять blocker canonical DB baseline и получить отдельную disposable DB.
2. Проверить настоящие save/readback, транзакционные rollback/retry, published-only reads, hide/unhide и review state.
3. Для R2-05 создать fixtures со ссылками на media во всех поддерживаемых published таблицах, drafts/change sets и galleries; удалить файл и проверить универсальный unlink в транзакции.
4. Проверить побочные эффекты удаления: cleanup queue, удаление object после commit, восстановление при storage error, deletion history.

### 5D — public publication smoke

Только staging и отдельное разрешение на запись/deploy: создать уникальный контент, пройти review, сверить DB/API, дождаться deploy status и content revision match, затем проверить public DOM. Не запускать это в обычной PR job.

## Порядок реализации

1. План и список кандидатов были одобрены пользователем; позднее пользователь разрешил автономно завершить согласованную работу и запускать необходимые целевые тесты.
2. Выполнить изолированные тесты клиента, выбора превью, переходов набора изменений, draft conflict и forged wheel view.
3. После отчёта по 5A отдельно спланировать 5B; браузерный harness автоматически не запускать.
4. Снять schema baseline blocker и подготовить disposable DB до 5C.
5. Реализацию продуктового изменения R2-05 (unlink + indicator) оформить отдельной фазой; тестовый аудит сам по себе не меняет поведение удаления.
6. 5D выполнять на staging после отдельного разрешения на запись/deploy и подтверждения безопасного тестового объекта.

## Выполнение 5A — 2026-10-08

Реализовано:

- `frontend-cms/src/admin/client/remoteRequest.test.ts`: source-text проверки заменены четырьмя проверками публичного `browserAdminClient()`: credentials и payload с baseline, сетевой отказ, код API ошибки и stale-save conflict при сохранении исходного пользовательского ввода в запросе.
- `frontend-cms/src/admin/pages/pagePreview.ts` и `pagePreview.test.ts`: выбор media asset вынесен в чистую функцию и покрыт пятью сценариями. `pageListPreview.test.ts` удалён после прохождения новой проверки.
- `src/components/shop/forgedView.test.ts`: три полезных сценария переведены в Vitest; прежний `forgedView.test.mjs` удалён после успешного запуска нового файла в runner, используемом CI.
- Изменений backend production-кода не было. Существующие тесты backend `changeSetTransitions` и `draftConcurrency` сохранены и запущены.

Команды и результаты:

- `frontend-cms`: `npm test -- src/admin/client/remoteRequest.test.ts src/admin/pages/pagePreview.test.ts src/admin/domain/changeSetTransitions.test.ts` — 3 файла, 12 тестов прошли.
- `backend-app`: `npm test -- src/admin/domain/changeSetTransitions.test.ts src/admin/domain/draftConcurrency.test.ts` — 2 файла, 7 тестов прошли.
- Корневой проект: `npm test -- src/components/shop/forgedView.test.ts src/lib/content/publishedClient.test.ts` — 2 файла, 13 тестов прошли.
- До добавления последней проверки конфликта дополнительно запускались 4 CMS файла (17 тестов), а также отдельный root forged-view запуск (3 теста); итоговые повторные команды выше содержат актуальные результаты.

Ограничения результата:

- R2-01 покрыт domain guard перехода review и существующими unit tests. Реальные роли и отсутствие публичного изменения до одобрения остаются сквозным сценарием 5B.
- R2-03 покрыт backend unit conflict guard и CMS контрактом передачи изменённого draft + baseline/получения `conflict`. Поведение двух браузерных сессий и восстановление формы остаются в 5B.
- CMS editor/showcase, media upload UI и document action wiring source assertions сохранены: DOM/browser replacements для них ещё не созданы.
- R2-02, R2-04, универсальный unlink R2-05, PostgreSQL и staging publication не проверялись этой фазой.
- Тесты запускались локально целевыми командами; lint, typecheck, build и полный suite не запускались.

## Выполнение 5B — 2026-10-08

DOM tests подготовлены через `jsdom` + Testing Library; детали, сценарии и ограничения находятся в [плане 5B](./CMS_PHASE_05B_DOM_TESTS_PLAN.md). Удалены только source tests, имеющие поведенческую замену. CMS полный suite: 27 файлов, 113 тестов; typecheck и lint прошли. Подтверждён security advisory отчётом npm: 5 high vulnerabilities остаются в dev dependency tree.

R2-05 полностью не покрыта: текущий UI показывает список использований и отключает удаление занятого файла; зелёного индикатора и unlink при удалении нет. Эти ожидания оставлены отдельной продуктовой задачей, потому что тестовая фаза не должна менять функцию приложения. 5C требует safe disposable PostgreSQL baseline; 5D требует staging write/deploy authorization и проверки точного content revision на public DOM.

## Результат и критерии

- Для каждого заменённого теста есть связь `требование → действие пользователя/контракт → наблюдаемое утверждение`.
- Выбранный runner реально обнаруживает файл в CI; отчёт не ограничивается наличием строки в source.
- Source assertion удалён только для page preview и forged view после прохождения соответствующего поведенческого теста. Остальные source assertions сохранены до появления замен.
- DB tests проверяют независимый readback и применённые migrations на disposable DB.
- Ни один уровень не выдаёт mocked fixture за доказательство реальной публикации.

## Не входит в этот план

Production/staging deploy, миграция реальной БД, DB integration, исправление приложения R2-05, browser harness и полная проверка публикации.
