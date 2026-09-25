# Task 5 Fix Report: Remaining selection CTAs

## Status

DONE

## Changes

- Added `ROUTES.selectionEntry = "/#solutions"` while keeping `ROUTES.selection = "/selection"` for the legacy redirect and sitemap.
- Pointed the live main footer's primary and "Подбор" links at `ROUTES.selectionEntry`.
- Pointed the About page tire-selection CTA at `ROUTES.selectionEntry`.

## Verification

- `npx tsc --noEmit` — passed (exit 0).
- Source sanity search found no user-facing `href` still using `ROUTES.selection`.
- IDE diagnostics found no errors in the three changed files.
- Commit self-review confirmed only the three requested CTA files were committed.

## Commit

`f80d4af Point remaining tire-selection CTAs at homepage #solutions.`

## Concerns

- `SiteFooter.tsx` was untracked before this fix, but it is the live footer implementation imported by `Footer.jsx` and `ShopFooter.jsx`, so it was included in the commit.
- Extensive unrelated pre-existing working-tree changes remain unstaged and untouched.
