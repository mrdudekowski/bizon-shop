# Task 1 Report — Document contract and client

**Status:** DONE

**Commit:** `683d09e`

**Branch:** `frontend-cms`

## What shipped

- Extended admin domain types: `TireDirectionDraft`, richer `TireSizeDraft` / `TireModelDraft`, wheel/shop/material gallery+PDF fields, `PageDraft` as `HomePageDraft | ShopHomePageDraft | StubPageDraft`.
- Client: tire direction CRUD/publish, `setUserRole`, `storageNotice`.
- Local adapter: wrap flat directions on load, replace pages without `hero` with empty seed, clamp placements on save, expanded `collectAssetUsage`, `last_admin` on role demotion.
- Cyrillic transliteration in `slugifyTitle` so plan test `createTireDirection({ name: "Регион" })` yields a valid slug.
- Minimal `PageEditor` hero field access so `tsc` still typechecks (full page UI is Task 4).

## Tests

**Command:** `npx tsc --noEmit; npx vitest run src/admin`

**Result:** PASS

- `tsc --noEmit`: exit 0
- `vitest run src/admin`: 3 files, 20 tests passed

New tests from the plan:
- publishes a tire direction only with a main image → `publish_blocked`
- rejects removing the last admin role → `last_admin`
- reports a repaired store once → Russian notice then `null`

## Concerns

1. `listTireDirections()` still returns flat `{ id, name, slug }`; document methods are separate. Callers that need the full draft must use `getTireDirection`.
2. Page editor is only SEO + hero eyebrow/title/lead; home/shop-home specific sections wait for Task 4.
3. Cyrillic slug transliteration was required by the plan’s “Регион” create test; existing slug tests still pass.
4. Report file and unrelated dirty app shell/pages are not part of this commit unless added later.
