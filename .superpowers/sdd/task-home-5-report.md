# Task 5 Report: Redirect selection and update CTAs

## Status

Complete. Legacy `/selection` URLs now redirect to the homepage inline wizard while preserving query parameters, and selection CTAs link directly to `/#solutions`.

## Changes

- Replaced the standalone selection page with a redirect through `selectionLegacyToHomePath`.
- Updated homepage, header, burger menu, cart item, and request-context links to the inline wizard.
- Kept `ROUTES.selection` unchanged for the legacy route and sitemap stability.
- Updated focused CTA and cart-item test expectations.

## Verification

- `npx vitest run src/lib/selection src/lib/cart/selectionCartItem.test.ts src/lib/cms/pages/merge.test.ts` — 5 files and 19 tests passed (exit 0).
- `npx tsc --noEmit` — passed (exit 0).
- Manual browser smoke — not run in this session.

## Commit

`76fbb94 Redirect /selection into homepage inline wizard and update CTAs.`

## Concerns

The workspace contains extensive unrelated pre-existing modifications and untracked files; they were not staged for this task.
