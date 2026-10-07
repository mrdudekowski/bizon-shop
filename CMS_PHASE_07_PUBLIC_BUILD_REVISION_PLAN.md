# Фаза 7 — локальный контракт revision для публичной сборки

Дата: 2026-10-08
Статус: **локальная/CI часть завершена; transient retry hardening готов и проверен; public deploy ждёт ручного перезапуска пользователя**.

## Цель

Проверить локально, что статический экспорт маркируется revision опубликованного снимка, и отказать в маркировке, если содержимое изменилось во время сборки. Включить этот путь в PR CI на in-memory fixture API.

## Основание

- Backend уже строит `sha256:` revision (`backend-app/src/contentRevision.ts`) из повторяемого read snapshot.
- `scripts/buildWithContentRevision.js` получает revision до/после Next build и отказывается писать marker при несовпадении.
- Root CI (`.github/workflows/deploy.yml`) вызывает `npm run build:ci`, который сейчас запускает Next напрямую через `scripts/ciBuildApiFixture.js`; endpoint revision и marker обходятся.
- Настоящая публичная публикация и staging DOM остаются вне фазы: они требуют БД и внешнего deployment.

## План

1. Добавить unit tests для общего revision-guard orchestration: совпавшие hashes маркируют build, drift/failure не маркирует.
2. Расширить build fixture endpoint валидным фиксированным revision.
3. Запускать `buildWithContentRevision.js` из CI fixture wrapper, чтобы PR build создавал `out/content-revision.json` тем же guard кодом, что локальный production build.
4. Покрыть unit tests статусы Timeweb + проверку публичного marker: совпадение, расхождение, pending deploy, malformed/unavailable origin.
5. Запустить root/backend unit suites, typecheck, lint и CI build fixture; проверить exit status и schema/hash marker в изолированном output.
6. Сверить, что тесты не обращаются к Timeweb, production DB или внешним сетям.

## Критерии завершения

- Revision guard unit tests проходят на стабильном revision и ожидаемо падают на drift/build error без записи marker.
- Root CI static export создаёт корректный schema-1 marker с SHA-256 revision.
- Все прочие root проверки проходят; точный revision-прогон на public DOM остаётся staging-only.

## Ограничения

Эта фаза подтверждает контракт build fixture и wrapper, но не фактический POSTGRES snapshot, deployment provider, CDN, публичный origin или DOM. DB proof ждёт снятия blocker фазы 5C; end-to-end staging proof — фазы 5D.

## Результат выполнения

- `runStableRevisionBuild` вынесен в тестируемую orchestration функцию. Тесты подтверждают: стабильная ревизия маркирует экспорт; revision drift и build failure не пишут marker.
- Контракт статуса Timeweb и public revision marker покрыт отдельными тестами с mock fetch: совпадение, mismatch, pending, недоступный origin и некорректный deployment ID.
- CI fixture теперь отдаёт валидный `/v1/content/revision`, а `npm run build:ci` запускает `buildWithContentRevision.js` вместо прямого Next build.
- Root suite: 36 файлов, 151 тест — passed. Backend suite: 43 файла, 196 тестов — passed. Root и backend typecheck — passed после дополнения обязательных `showInMenu`/`menuOrder` в forged wheel test fixture. Root lint — 0 ошибок, 13 предупреждений.
- Production export запущен в изолированной временной копии, не трогая основной `out/`. Next сгенерировал 28 страниц; `out/content-revision.json` создан с `schema: 1` и валидной `sha256:` ревизией.
- Проверки провайдера/public marker используют mock fetch и не обращались к Timeweb; сборка обращалась только к локальному fixture API. Production DB и `PUBLIC_SITE_URL` не использовались. Временная копия удалена после проверки результата.
- После сообщения о сбое `HTTP 503` публичный backend `/v1/content/revision` проверен напрямую: `200 application/json`, валидная schema-1 revision. Это подтверждает, что endpoint сейчас доступен; прежний лог build фиксирует временное состояние на момент запуска, а не текущую доступность.
- `scripts/buildWithContentRevision.js` теперь повторяет только временные HTTP/network ошибки до 3 попыток с задержками 500/1000 мс. Нет fallback на старую ревизию: постоянная недоступность по-прежнему должна остановить сборку, чтобы не выдать устаревший marker за актуальный.
- Root revision tests: 6 passed; root typecheck passed. Публичный деплой не запускался Codex: пользователь сообщил, что перезапускает его вручную. Новый результат ещё не подтверждён в Timeweb.
