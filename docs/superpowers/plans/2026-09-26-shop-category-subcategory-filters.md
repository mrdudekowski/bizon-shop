# Shop Categories and Subcategories Implementation Plan

> **For an implementation agent:** execute one phase at a time, keep the user informed at each checkpoint, and stop at the approval gates below. Preserve all existing work in both repositories.

**Goal:** Make each Shop category a focused workspace for its products, while letting editors create and assign category-scoped subcategories from the product editor. Use those same subcategories to filter products in the CMS and on the public site.

**Architecture:** The CMS category list opens a category workspace with Products and Category settings tabs. A product has one primary Shop category and an optional subcategory belonging to that category. Subcategories are reusable classification values, not cards, standalone pages, or product variants. The CMS remains on its existing Postgres-backed admin client. The backend publishes subcategory data only for published products, and the public catalog filters within the current category. CMS, backend, and public app remain separate repository boundaries and must be verified in sequence.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, existing CMS catalog components and design tokens, the existing Bizon backend/Postgres adapter, and the public Next.js Shop catalog.

**Global Constraints:**
- Do not invent or populate product specifications. Existing products keep their category and receive no guessed subcategory assignments.
- Do not create subcategory cards or standalone category landing pages.
- Preserve current category/product URLs, statuses, publish rules, and product variants.
- Do not start schema/backend changes until the data model and cross-repository readiness are approved at Phase 0.
- Preserve unrelated dirty changes in both repositories. Do not reset, clean, commit, or push.
- Match the current CMS styles: `--canvas: #f3f4f6`, white surfaces, dark text, muted gray, yellow `--accent: #ffd300`, visible focus, 44px controls, and 8–12px corner radii. Prefer existing catalog components and responsive patterns over a new design system.
- Keep backend and public-site changes in `../Bizon-main-app`; do not blur that boundary with the standalone CMS.

## Phase 0 — Confirm the model and integration readiness

**Purpose:** Resolve the data decisions that affect schema, editor behavior, and public filters before coding.

**Review:**
- CMS product/category shape and current Shop flow: `src/admin/domain/types.ts`, `src/admin/shop/ShopProductList.tsx`, `src/admin/shop/ShopCategoryEditor.tsx`, `src/admin/shop/ShopProductEditor.tsx`, `src/admin/client/adminClient.ts`.
- Backend admin persistence and schema/migration conventions: `../Bizon-main-app/backend-app/src/admin/domain/types.ts`, `../Bizon-main-app/backend-app/src/admin/client/adminClient.ts`, `../Bizon-main-app/backend-app/src/admin/server/postgresAdmin.ts`, and the repository's actual migration/schema files (discover their location rather than assuming one).
- Public Shop contract: `../Bizon-main-app/backend-app/src/mapShop.ts`, `../Bizon-main-app/backend-app/src/publishedRead.ts`, `../Bizon-main-app/src/lib/content/types.ts`, `../Bizon-main-app/src/lib/content/staticCatalog.ts`, `../Bizon-main-app/src/app/(site)/shop/[categorySlug]/page.tsx`, and `../Bizon-main-app/src/components/shop/ShopProductCatalog.tsx`.

**Recommended model for approval:**
- `ShopCategory` is the top-level catalog category.
- `ShopSubcategory` has a stable ID, parent `categoryId`, display `name`, URL-safe `slug`, and ordering value. Its slug/name is unique within its parent category.
- `ShopProduct` retains one primary `categoryId` and gets an optional `subcategoryId`. The subcategory must belong to the selected category.
- Product variants remain size/color/SKU/availability options. They are not category or subcategory values.
- Subcategories have no separate publication status. A subcategory becomes available as a public filter only when at least one published product uses it.
- Renaming a subcategory preserves its ID and product associations. Deleting an assigned subcategory is blocked until its products are reassigned or cleared. Changing a product's category clears an incompatible subcategory with an explanation.

**Approval gate:** Confirm the proposed cardinality (one primary category and at most one subcategory per product) and the readiness of the CMS → backend → public contract. If products need multiple categories or multiple subcategories, revise the model before Phase 1. No code or migration work in this phase.

**Exit criteria:** Approved model; discovered migration location and constraints; field-mapping table from CMS draft/published records through backend to public product; agreed phase boundary for backend/public work.

## Phase 1 — Persist subcategories and extend the admin contract

**Purpose:** Add durable, category-scoped subcategories without changing existing product classification.

**Likely files:**
- CMS: `src/admin/domain/types.ts`, `src/admin/client/adminClient.ts`, `src/admin/client/remoteAdminClient.ts` (confirm exact implementation file during Phase 0).
- Backend: `../Bizon-main-app/backend-app/src/admin/domain/types.ts`, `../Bizon-main-app/backend-app/src/admin/client/adminClient.ts`, `../Bizon-main-app/backend-app/src/admin/server/postgresAdmin.ts`, and the discovered migration/schema location.

**Steps:**
1. Add the subcategory domain shape and list/create/rename/delete operations, scoped by category.
2. Persist subcategories in the existing canonical Postgres database and connect products through the approved nullable `subcategoryId` relation.
3. Enforce parent existence and category/subcategory consistency; enforce unique normalized slug/name within a category.
4. Prevent deleting a subcategory while products still reference it. Preserve stable IDs on rename.
5. Keep existing records valid: no destructive rewrite, no guessed assignment, and no second store or localStorage path.
6. Extend admin API payloads and error handling with specific conflict/validation messages.

**Exit criteria:** Existing product/category reads and writes retain their behavior; subcategory CRUD persists across reloads; invalid cross-category assignments and deletion of assigned values are rejected.

## Phase 2 — Make a category a Shop workspace

**Purpose:** Replace the long combined category-and-products page with a clear two-level workflow.

**Likely files:**
- `src/admin/shop/ShopProductList.tsx`
- `src/admin/shop/ShopCategoryEditor.tsx`
- `src/app/shop/page.tsx`
- `src/app/shop/categories/[id]/page.tsx`
- A focused list component such as `src/admin/shop/ShopCategoryProducts.tsx`
- Existing shared UI: `src/admin/ui/catalog.module.css`, `src/admin/ui/CatalogRow.tsx`, `src/admin/ui/CatalogFilters.tsx`, and related catalog components (reuse only after confirming their current APIs).

**Steps:**
1. Keep `/shop` focused on category rows/cards only; remove the inline products section beneath the categories.
2. Make category rows open the existing `/shop/categories/:id` route. Show category name, publication status, product count, and a clear open affordance.
3. Turn the category route into a compact workspace with breadcrumb, category title/status, and real tabs: **Товары** and **Настройки категории**. Keep both views on the same route and retain unsaved form values when switching tabs.
4. Put search, status, subcategory filter, product list, and **Добавить товар** in the Products tab. Keep category fields and its save/publish controls in Settings.
5. After category creation, route directly to its workspace. Creating a product there preselects and locks the current category unless the editor has a clear reason to change it.
6. Reuse current dense row/list patterns and empty states. Do not introduce a grid of subcategory tiles.

**Exit criteria:** The category index contains no product list; opening a category immediately shows its products; category settings remain accessible; creation flow has a clear next action; switching tabs does not discard unsaved category fields.

## Phase 3 — Add inline subcategory assignment in the product editor

**Purpose:** Let editors manage and assign subcategories while editing a product, without turning them into separate catalog records/cards.

**Likely files:**
- `src/admin/shop/ShopProductEditor.tsx`
- `src/admin/shop/ShopDocument.module.css`
- A small control such as `src/admin/shop/ShopSubcategoryPicker.tsx`
- Existing dialog/control patterns under `src/admin/ui/` (reuse the current create-dialog form and validation style).

**Steps:**
1. Add a subcategory selector directly below the primary category field. It is disabled until a category is selected and shows only that category's subcategories.
2. Add **Создать подкатегорию** next to the selector. Use a compact modal/dialog matching the existing catalog creation dialog; require a name, generate or edit the slug using existing conventions, and show inline validation.
3. After creation, select the new subcategory in the current product form without losing other unsaved fields.
4. If category changes, clear the old subcategory if it does not belong to the new category and explain that change inline.
5. Add an accessible way to rename or remove subcategories from the selector's management affordance; block removal while assigned products remain and explain what needs to be reassigned.
6. Preserve current save/publish semantics and keep variant fields separate from classification.

**Exit criteria:** Create → auto-select → save/reload works; category change cannot leave a mismatched subcategory; keyboard focus, modal dismissal, validation, and screen-reader labels are coherent; product specifications remain untouched.

## Phase 4 — Add CMS filtering and category counts

**Purpose:** Make subcategories useful during catalog operations.

**Likely files:** `src/admin/shop/ShopCategoryProducts.tsx`, `src/admin/shop/ShopProductList.tsx`, `src/admin/ui/CatalogFilters.tsx`, and `src/admin/ui/catalog.module.css` only if shared styles need a small responsive adjustment.

**Steps:**
1. Add a category-scoped subcategory filter beside existing search and status filters.
2. Ensure search, status, and subcategory filters combine predictably and offer a one-action clear/reset state.
3. Show useful empty states for no products, no matching products, and no subcategories yet; distinguish these cases and provide the relevant next action.
4. Calculate category product counts consistently, documenting whether counts include drafts; use the same rule everywhere in CMS.
5. At narrow widths, let filters wrap or stack without horizontal overflow; preserve readable labels, control sizes, and row actions.

**Exit criteria:** Each filter works alone and in combination; clearing filters restores results; no horizontal overflow at the CMS responsive breakpoint; category counts follow the agreed draft/published rule.

## Phase 5 — Publish subcategory data and expose public filters

**Purpose:** Keep CMS and storefront classification aligned while preventing draft data from leaking publicly.

**Likely files:**
- Backend: `../Bizon-main-app/backend-app/src/mapShop.ts`, `../Bizon-main-app/backend-app/src/publishedRead.ts`, plus backend public route/contract files found during Phase 0.
- Public app: `../Bizon-main-app/src/lib/content/types.ts`, `../Bizon-main-app/src/lib/content/staticCatalog.ts`, `../Bizon-main-app/src/app/(site)/shop/[categorySlug]/page.tsx`, `../Bizon-main-app/src/components/shop/ShopProductCatalog.tsx`, `../Bizon-main-app/src/components/shop/ShopProductCatalog.module.css`.

**Steps:**
1. Extend the published product shape with subcategory ID/name/slug, using a complete mapping from the approved persisted fields.
2. Ensure public reads include only published products and published parent categories; never expose CMS drafts.
3. Add an optional subcategory query filter to the category product endpoint and preserve the current category route.
4. On the category page, show a compact filter control only when published products have subcategories. Do not show empty or draft-only options.
5. Apply the filter without changing the category landing route; use a shareable query parameter if that matches the current site navigation/cache conventions confirmed in Phase 0.
6. Match the public site's existing typography, controls, cards, responsive breakpoints, and focus treatment rather than copying the CMS yellow styling blindly.

**Exit criteria:** CMS-published classification appears on the public category page; draft-only subcategories do not appear; selecting a subcategory filters only within the current category; removing the filter restores all category products; existing Shop routes still work.

## Phase 6 — Adoption and cross-surface verification

**Purpose:** Confirm the workflow and keep current catalog data safe.

**Steps:**
1. Verify existing products retain their category, URL, status, images, prices, and variants. Leave subcategory empty unless a human has supplied classification.
2. Walk through category create → category workspace → product create → inline subcategory create/assign → save → publish → CMS filter → public filter.
3. Verify rename keeps assignments, deletion is blocked while assigned, changing category clears incompatible selection, and drafts never appear on the public site.
4. Inspect desktop and narrow screens, keyboard-only interactions, focus visibility, labels, loading/empty/error states, and long category/subcategory names.
5. Run the repository-appropriate checks and capture representative browser screenshots only after each affected app is running. Report CMS behavior, backend contract behavior, and public runtime evidence separately.

**Final acceptance:** Category cards are the only top-level Shop overview entries; category details contain product management; subcategories are created/assigned inline as lightweight filter terms; products can be filtered consistently in CMS and on the public site; existing data and publication boundaries remain intact.

## UI/UX alignment checklist

- Use the existing CMS yellow accent `#ffd300` for primary actions and selection, with white surfaces and gray borders on the current light canvas.
- Preserve 44px minimum control height, visible keyboard focus, labels above fields, and the current 8–12px radius range.
- Keep the category workspace dense and task-focused: one title row, tabs, compact filters, then the list. Avoid nested oversized cards and repeated descriptions.
- Use the established catalog row/status/action components and existing modal behavior; avoid icon-only destructive actions without an accessible name and confirmation where applicable.
- Keep status controls visually and behaviorally consistent with existing immediate status changes; category/product publish rules do not change as part of classification.
- Responsive behavior: filters wrap or stack, tabs remain reachable, product rows reflow, and dialogs fit within the viewport without horizontal scrolling.
- Public site uses its own established visual language and filter conventions; share the data model and behavior, not admin-only visual treatments.
