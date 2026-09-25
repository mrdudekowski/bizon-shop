# Polish report — frontend-cms admin

## Status

**Done.** All 13 review findings applied. Controllers left as decided: `PageDraft.id` remains the page key; navigation stays one «Страницы» item.

## Verification

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | pass |
| `npx vitest run src/admin` | pass — **3 files, 26 tests** |

## Commit

Source + tests only (no `.codex-temp`, `.npm-cache`, reports, test-results, `tsconfig.tsbuildinfo`, `.superpowers`).

## What changed

1. **Hide / delete** for tire directions, wheel types/models, shop categories/products; materials + tire models use the same rule: hide only when `publishedSnapshot != null` (else `publish_blocked`); delete only when no snapshot. Admin UI: «Скрыть с сайта» vs «Удалить» mutually exclusive.
2. **`saveNamed`** rejects cross-document slug collisions with `slug_taken` (tire models unchanged).
3. **PlacementFields** — select from `listAssets()`; keeps alt/focal/crop or defaults focal `0.5` + full crop.
4. **Publish blockers** — shop variants need size + price choice; wheel/shop duplicate trimmed lower-case size → `duplicateSize`.
5. Empty SKU shows «SKU не заполнен»; not a publish blocker; covered by test.
6. «Есть несохранённые правки» whenever draft ≠ `savedDraft` in tire/direction/wheel/shop/page/material editors.
7. List «есть черновик» + Russian status on directions, wheel models, shop products, materials, pages; wheel types & shop categories show status.
8. **`getWheelType` / `getShopCategory`** — editors use them.
9. **`/users`** — editors see only «Раздел доступен администратору»; no create/disable/role calls.
10. Role-change `last_admin` → «Нельзя снять роль у последнего администратора»; disable keeps the disable wording.
11. Page/material editors map error codes to Russian; lists show черновик / на сайте / скрыто.
12. Seed `dir-long-haul` starts with `slugLocked: false`.
13. New store tests for duplicate size, slug free on delete, empty SKU publish, shop variant price, wheel type slug_taken.

## Could not fix

Nothing outstanding from the review list.
