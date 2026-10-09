# Фаза 5B — CMS DOM tests

Связанные документы: [общий аудит](./CMS_TEST_COVERAGE_AUDIT_2026-10-08.md), [решения фазы 2](./CMS_PHASE_02_DECISION_LOG.md), [архитектура тестов](./CMS_PHASE_03_TEST_ARCHITECTURE_DESIGN.md), [оценка кандидатов](./CMS_PHASE_04_TEST_CANDIDATES_REVIEW.md), [план фазы 5](./CMS_PHASE_05_TEST_REPLACEMENT_PLAN.md). Статус: **выполнена в ограниченном объёме, без изменения production behavior**.

## Цель

Заменить выбранные source-text assertions тестами смонтированных CMS компонентов, проверяющими пользовательские действия, доступные сообщения и обращения к `browserAdminClient`.

## Дизайн

Использовать существующий Vitest runner с `jsdom`, `@testing-library/react` и `@testing-library/user-event`. Каждый тест монтирует настоящий React компонент, а `browserAdminClient` заменяется управляемым in-memory client fixture. Fixture хранит draft, saved draft, published snapshot, роль и change set; ответы и вызовы можно проверить после действия пользователя. Существующие remote-client тесты отдельно проверяют реальный fetch payload, поэтому DOM-тесты не должны дублировать транспортный контракт.

Такой вариант легче для CMS CI и локального запуска, чем отдельный Playwright browser stack, и проверяет доступность контролов и UI state. Он не проверяет backend persistence, реальные роли на сервере, PostgreSQL транзакции или публичный сайт. Для этих гарантий остаются backend unit tests и отдельные фазы 5C/5D.

## Файлы и задачи

1. `frontend-cms/package.json`, `package-lock.json`: добавить только dev dependencies для jsdom и Testing Library; не менять производственные зависимости.
2. `frontend-cms/vitest.config.ts`: оставить существующий Node default; DOM-тесты включают jsdom environment директивой в тестовом файле, чтобы остальные suite не меняли окружение.
3. Каждый DOM test file задаёт локальный mock `browserAdminClient` и минимальный fixture только для своего сценария. Общий тестовый helper вводить лишь при доказанном повторении setup; не добавлять test-only методы в production-классы.
4. `frontend-cms/src/admin/pages/PageEditor.ui.test.tsx`: заполнение поля, save request, отправка на approval; stale conflict оставляет введённый текст в поле и показывает конфликт. Проверить, что editor не видит действие прямой публикации.
5. `frontend-cms/src/admin/shop/ShopShowcaseEditor.ui.test.tsx` и `PageEditor.contract.test.ts`: проверить видимость showcase controls и сохранённый payload; удалить source-text тест только после успешного DOM replacement.
6. `frontend-cms/src/admin/media/PlacementFields.ui.test.tsx` и `PlacementFields.upload.test.ts`: реальный выбор файла, upload state/error, replace/cancel и gallery action. Удалить соответствующий source-text файл только после эквивалентного покрытия.
7. `frontend-cms/src/admin/ui/DocumentReviewFooter.ui.test.tsx`, `frontend-cms/src/admin/pages/PageEditor.ui.test.tsx` и `documentActionCopy.test.ts`: проверить role=status/alert и PDF upload error. Сохранить независимые unit tests `actionFeedback.test.ts` и `uploadError.test.ts`.
8. `frontend-cms/src/admin/media/MediaLibrary.ui.test.tsx`: только текущий UI поведения предупреждения/использования, если компонент его уже предоставляет. Не выдавать тест за доказательство универсального unlink или отсутствующего зелёного индикатора.

## Порядок работы

Для каждого behavior test: сначала написать один наблюдаемый сценарий, затем запустить его и подтвердить ожидаемый RED, внести минимальные изменения fixture или компонента только когда без них нельзя проверить существующую функцию, повторить тест и проверить связанные UI tests. Не добавлять production behavior, чтобы сделать тест зелёным без отдельной реализации.

## Проверки

- Целевые файлы: `npm test -- <список DOM тестов>` в `frontend-cms`.
- После замен: запустить соответствующие старые и новые тесты вместе; старые source-text assertions удалять только при успешной замене.
- На уровне этой фазы не запускать backend, DB, migrations, S3, deployment, полный build или публичный сайт.
- Перед завершением: `git diff --check` и проверка статусов всех трёх checkout, чтобы не задеть имеющиеся dirty changes.

## Явные исключения

- Не реализовывать универсальное отвязывание media при удалении и не менять разрешение/запрет удаления: это отдельная продуктовая задача по R2-05.
- Не добавлять тест, который утверждает наличие зелёного индикатора, пока сам пользовательский контракт не реализован.
- Не подменять UI fixture доказательством DB persistence или публикации на сайте.
- Не удалять source-text тесты Shop showcase, PlacementFields и document action до прошедших поведенческих замен.

## Критерии завершения

- В Vitest реально запускаются DOM tests для целевых редакторов и media controls.
- Тесты проверяют ввод пользователя, видимое сообщение и конкретные вызовы/payload client fixture.
- Source-text tests удалены только при равной или лучшей поведенческой проверке.
- Нет изменений production поведения; нерешённые требования R2-05 явно перенесены в отдельную фазу продукта.

## Выполнение — 2026-10-08

Подключены `jsdom`, `@testing-library/react` и `@testing-library/user-event` как dev dependencies. В Vitest добавлен сбор `.test.tsx` и Oxc automatic JSX transform; остальные тесты по-прежнему запускаются в Node. DOM tests используют реальные CMS-компоненты, управляемый mock AdminClient и jsdom; внешние сервисы не запускаются.

Новые сценарии: editor conflict сохраняет введённый текст; editor сохраняет и отправляет пакет на review без прямой публикации; Shop showcase controls и payload; отсутствие carousel controls в обычном page editor; категории отделяют identity settings от presentation; upload progress/error, media replacement/cancel, product gallery; media usage locations, disabled delete и confirmation для незанятого файла; admin review approve/return/cancel dialogs и editor role gating; footer status/alert и PDF upload error.

Заменены source-text тесты `PageEditor.contract.test.ts` и `ShopShowcaseEditor.contract.test.ts`. В `documentActionCopy.test.ts` удалены проверки source для feedback role и PDF upload error после соответствующих UI tests. Сохранилась проверка source для publish success copy во всех entity editors. `PlacementFields.upload.test.ts` сохранён: assertions для layout/focus/CSS ещё не заменены browser visual test.

Проверки: `npm test` — 27 файлов и 113 тестов прошли; `npm run typecheck` прошёл; `npm run lint` завершился без ошибок. Первая проверка typecheck выявила три ошибки только в тестовых типах; они исправлены, затем typecheck прошёл. `npm install` сообщил о пяти high severity уязвимостях в dev dependency tree (`eslint-config-next`, `@next/eslint-plugin-next`, `braces`, `fast-glob`, `micromatch`); зависимости автоматически не обновлялись.

Остаток: тестовый fixture не доказывает серверную role enforcement/persistence или фактическое состояние публичного сайта; это 5C/5D. Удаление используемого media сейчас блокируется; запрос пользователя об универсальном unlink и зелёном светящемся индикаторе остаётся продуктовому этапу R2-05. UI DOM test подтверждает текущий список usage и disabled delete, но не приписывает продукту ещё отсутствующий indicator/unlink.
