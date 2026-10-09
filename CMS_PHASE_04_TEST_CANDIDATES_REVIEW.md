# Фаза 4 — результат оценки кандидатов на переписывание

Дата: 2026-10-08. Основа: только исходники и конфиги. Тесты не запускались, файлы не менялись.

## Решения по кандидатам

| Файл/набор | Что защищает сейчас | Оценка | Решение |
|---|---|---|---|
| `frontend-cms/src/admin/client/remoteRequest.test.ts` | сетевой отказ превращается в `network`; remote save передаёт последнюю загруженную копию `savedDraft` | Проверяет важный контракт, но только наличие строк в `localStore.ts`; переименование/рефакторинг ломает тест без изменения поведения | **Переписать** на наблюдаемое поведение remote client. Нужен публичный тестовый seam/инъекция fetch для HTTP request helper; отдельно проверить credentials, payload baseline, HTTP error и network error |
| `frontend-cms/src/admin/pages/PageEditor.contract.test.ts` | намерение убрать Shop carousel из обычного Pages editor | Source slicing фактически проверяет отсутствие строки в двух компонентах и не проверяет пользовательский экран/сохранение | **Переписать** совместно с Showcase UI: проверить, что carousel редактируется на Shop showcase и отправляется в `savePage("shop-home", ...)`; Pages editor не имеет этих controls |
| `frontend-cms/src/admin/pages/pageListPreview.test.ts` | выбор изображения страницы по ID media asset | Ищет точный JSX-фрагмент в `PageList.tsx`; не вызывает resolver и не показывает карточку | **Переписать**: выделить чистый resolver (или browser test списка) и проверить home/shop/stub выбор, отсутствующий asset и пустое превью |
| `frontend-cms/src/admin/shop/ShopShowcaseEditor.contract.test.ts` | наличие областей showcase, сохранение/публикация Shop home, отсутствие дублирующих controls категории | Контракт полезен, но основан на строках и может пройти при неработающем control/callback | **Переписать** на пользовательские действия и payload после сохранения. Поведенческая проверка должна дополнить PageEditor test, а не дублировать тот же assertion |
| `frontend-cms/src/admin/media/PlacementFields.upload.test.ts` | upload/replace/cancel, upload progress/error, галерея/thumbs и preview layout | Все четыре теста читают JSX/CSS строки; не вызывают client, не загружают файл и не проверяют DOM. `fitCmsPreviewToViewport` сейчас находится внутри React component и не является чистой тестируемой функцией | **Разделить**: client contract на upload/replace/cancel; UI/browser сценарий на progress/error/cover/gallery/focus. Не тестировать запрет конкретного внутреннего API (`FileReader`) как цель поведения |
| `frontend-cms/src/admin/ui/documentActionCopy.test.ts` | роль status/alert, publish/error сообщения в редакторах, PDF upload feedback | `actionFeedback.test.ts` уже напрямую проверяет `feedbackRole`, error mapping и доступные статусы; source scan лишь подтверждает вставки в JSX | **Сократить/переписать**: сохранить unit тест `actionFeedback.test.ts`; source scan заменить browser-level проверкой объявления status/alert и доступности ошибки в ключевых редакторах. Не удалять до замены |
| `frontend-cms/src/admin/client/actionFeedback.test.ts` | правило перевода кода ошибки и роли live message | Тестирует чистые функции напрямую, без моков UI | **Оставить**; не дублирует DOM wiring тест полностью |
| `src/components/shop/forgedView.test.mjs` | три полезных mapping cases: CMS fields→forged view, отказ без hero image, fallback | Тесты содержательные и независимые, используют `node:test`, импортируют TS-модуль. Не покрываются явным Vitest include `src/**/*.test.ts`, отдельного CI `node --test` в workflow нет | **Оставить сценарии и включить в исполняемый suite** после выбора совместимого runner. Не удалять. Отдельно проверить совместимость Node 24/TS import при согласованном запуске |
| `backend-app/src/migrations/{mediaDeletionHistory,mediaObjectMetadata,mediaReplacements,passwordResetHistory}.test.ts` | версии и критичные имена/ограничения SQL миграций | Полезные smoke/intent assertions; не доказывают синтаксис и применение на поддерживаемой PostgreSQL | **Оставить**, добавить отдельный DB migration integration слой после появления schema baseline |
| `backend-app/src/migrations/shopCatalogShowcase.test.ts` | регистрация миграции и важные seed/relationship фрагменты | Проверяет source/SQL markers; DB effect не проверяет | **Оставить** как быстрый guard; добавлять поведение на disposable DB позже |
| CMS/backend пары `changeSetTransitions`, `draftDiff`, `changeSetGrouping`, `editorPermissions` | аналогичные domain contracts в двух самостоятельных реализациях | Похожее покрытие оправдано: CMS local client и backend server имеют разный код и риски дрейфа | **Оставить обе стороны**; добавить parity cases только для норм, которые должны совпадать. Не объединять и не удалять |

## Влияние утверждённых требований

1. Для R2-01 заменить слабые проверки на сохранение editor → open change set → submit → admin review → publish; проверить прямой publish admin на editor-authored открытом пакете и его явный audit trail.
2. Для R2-02 отдельно проверить hide: запись перестаёт быть в published API и остаётся управляемой в CMS.
3. Для R2-03 сначала проверить unit conflict baseline, затем browser recovery: ответ 409 не затирает первую версию и сохраняет ввод второй формы.
4. Для R2-04 проверить deploy state + совпадение content revision; unit test существующего status helper не заменяет реальный staging smoke.
5. Для R2-05 необходимы новые тесты после отдельного согласования реализации: UI предупреждает/показывает зелёный светящийся индикатор; удаление универсально снимает все ссылки из таблиц, CMS drafts и change sets; после удаления нет ссылок на отсутствующий media ID; публикация записи с обязательным пустым изображением блокируется.

## Граница результата

Статически подтверждено, что тесты с source-text assertions хрупкие и часть CMS behaviors не исполняется в DOM. Ни один кандидат не признан безопасным к удалению. Перед любым переписыванием нужно согласовать точный список, добавить замены, выполнить выбранные тесты в разрешённом контуре и только потом рассматривать удаление старого assertion.
