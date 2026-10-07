# Фаза 8 — публичные маршруты статического экспорта

Дата: 2026-10-08
Статус: **фикс локально внесён; CI-fixture и staging подтверждение в работе**.

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
- Публичная выкладка и проверка extensionless visitor URL остаются обязательными после push.
