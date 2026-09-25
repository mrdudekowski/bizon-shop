### Task 5 fix: remaining selection CTAs → `/#solutions`

Reviewer FAIL: Footer and About still target `ROUTES.selection` (`/selection`).

**Keep** `ROUTES.selection = "/selection"` for sitemap/redirect stability.

**Do:**
1. Add `selectionEntry: "/#solutions"` to `ROUTES` in `src/constants/navigation.js` (or hardcode `/#solutions` to match MainChrome/SiteShell — prefer `ROUTES.selectionEntry` for SSOT).
2. Update `src/components/Footer/SiteFooter.tsx` primary + "Подбор" links to `ROUTES.selectionEntry` (or `/#solutions`).
3. Update `src/app/(site)/about/page.tsx` CTA `href` the same way.
4. Grep `src` for remaining user-facing tire-selection CTAs still pointing at `/selection` (ignore sitemap, redirect page, SelectionWizard dead code if unused, tests that assert redirect).
5. Commit ONLY the files you change for this fix (do not stage unrelated WIP).
6. Message: `Point remaining tire-selection CTAs at homepage #solutions.`

Work from: `C:/Users/HP/Documents/Cursor projects/Commersial/Bizon`
Branch: `feat/home-inline-selection`

Report status DONE / DONE_WITH_CONCERNS / BLOCKED to `.superpowers/sdd/task-home-5-fix-report.md`
