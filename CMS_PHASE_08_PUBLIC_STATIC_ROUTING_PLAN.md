# Фаза 8 — публичные маршруты статического экспорта

Дата: 2026-10-08
Статус: **завершена: фикс развернут и проверен на публичном Front**.

## Наблюдаемая проблема

- Front на `917700f` успешно отдаёт главную и revision marker.
- CMS ссылается на публичную статью по `/tire-iq/<slug>`; static host возвращает на этом extensionless URL главную страницу.
- Канонические экспортированные файлы `/tire-iq.html` и `/tire-iq/<slug>.html` содержат правильные страницы.
- В `next.config.mjs` задан `output: "export"`, но не было `trailingSlash`. Next по умолчанию экспортировал `.html` route-файлы, не совпадающие с extensionless ссылками и поведением Timeweb fallback.

## Решение

Включить `trailingSlash: true` для публичного export. Next должен генерировать route directories с `index.html` и нормализовать внутренние ссылки к конечному `/`, что совпадает с уже развернутым CMS и статическим directory index. Не отключать SPA Fallback, пока не проверены все публичные маршруты: это может превратить неверные ссылки в 404 без исправления их генерации.

## Проверки и критерий выхода

1. Unit test фиксирует `output: "export"` вместе с `trailingSlash: true`.
2. Изолированный `npm run build:ci` должен создать `out/tire-iq/index.html` и `out/tire-iq/<fixture-slug>/index.html`; внутренние ссылки должны заканчиваться `/`.
3. В local dev проверяется, что `/tire-iq` и `/tire-iq/<slug>` переходят на slash-формы, а `/` остаётся 200.
4. После выкладки проверить staging `/tire-iq/`, ссылку из списка на `/tire-iq/<slug>/`, отображаемую статью и совпадение публичного revision marker с backend.

## Результат

- Unit test сначала упал на отсутствующем `trailingSlash`, затем прошёл после изменения конфига.
- Typecheck прошёл.
- CI fixture build в изолированной копии завершился успешно; созданы `out/tire-iq/index.html` и `out/tire-iq/ci-fixture-article/index.html`; canonical href статьи и back-link к коллекции имеют slash-форму.
- Root local dev отвечает 200; `/tire-iq` и `/tire-iq/quarry-tbr-operating-conditions` отвечают 308 с `Location` на соответствующий URL с `/`.
- Предыдущий первый запуск сборки в основном checkout столкнулся с активным dev server на общем `.next` и оставил локальный dev route на 500. Выявлено по неполному `.next/server/app-paths-manifest.json`; локальный dev восстановлен штатным `npm run dev:clean`, после чего root вернулся к 200. Успешная production-like проверка выполнена в отдельной временной копии, не разделяющей `.next`.
- Front успешно развернут на `b5440a5` (`fix: align public static routes with host`); в настройках Timeweb был вручную закреплён старый коммит `72452d1`, выбор актуального коммита сохранён и пересборка завершена успешно.
- Публичный `/tire-iq/` показывает список 13 материалов. Ссылка на статью `quarry-tbr-operating-conditions` ведёт на URL с конечным `/`; страница содержит ожидаемые заголовок, описание и полный текст статьи, а не главную страницу.
- `GET /content-revision.json` через HTTP отдаёт `application/json`, schema 1 и revision `sha256:32e5d88f84508b6523b69017baf0695973e2088fb88d9976a0cd52fb3918c075`; `GET /v1/content/revision` на backend возвращает тот же revision.
- Проверены и extensionless URL без конечного `/`: оба отвечают HTTP 308 с `Location` на соответствующий URL с `/`.
- Проверка revision marker выполнена прямым HTTP-запросом, поскольку in-app browser показывает JSON URL как страницу приложения: raw response содержит ожидаемый JSON и `Content-Type: application/json`.
