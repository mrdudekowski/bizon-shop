# CMS Catalog View Switch Implementation Plan

> **For agentic workers:** Execute this plan task-by-task in the current session. The user requested inline implementation and approved the design.

**Goal:** Add persistent list/tile view controls to the tire, wheel, shop-category, material, and page catalogs, with a count-based initial choice.

**Architecture:** Add a shared client hook for per-section localStorage preferences and a shared accessible view control. Extend CatalogRow with a square photo tile presentation that retains its existing navigation, publication status, unpublished-draft indicator, and delete flow. Integrate the view state into the six specified collection screens, including tire-direction management.

**Tech Stack:** Next.js App Router, React client components, TypeScript, CSS Modules, browser localStorage.

## Global Constraints

- Show tiles by default when the unfiltered collection has 6 or fewer items; show the list by default above 6.
- Persist a manual view choice independently for each section; it overrides that section's automatic default.
- Search and status filters do not change the count used for the default.
- Tiles are square, rounded, use an image background with a bottom gradient, and keep the title readable over the image.
- Preserve every current list action and keep list styling unchanged.
- Respect repository CSS guidance: explicit grid tracks, min-width constraints, and responsive sizing.
- Preserve all pre-existing dirty working-tree changes; stage and commit no implementation files unless separately requested.
- Do not add or run tests unless the user requests them.

---

### Task 1: Add shared view preference and accessible control

**Files:**
- Create: src/admin/ui/catalogView.ts
- Create: src/admin/ui/CatalogViewToggle.tsx
- Modify: src/admin/ui/catalog.module.css

**Interfaces:**
- CatalogView = list | tiles.
- useCatalogView(sectionKey: string, itemCount: number) returns { view: CatalogView, setView: (view: CatalogView) => void }.
- CatalogViewToggle accepts view and onChange and renders a labeled two-button group with aria-pressed state.
- If no valid saved value exists, view is tiles for counts 0–6 and list for counts 7+.
- Read and write localStorage defensively; a browser storage exception must leave the automatic view usable.

**Steps:**
- [x] Implement the hook with a section-keyed storage key and validate stored values against list and tiles.
- [x] Implement the accessible Список / Плитки controls and shared segmented-control styles.
- [x] Add .catalogTiles with explicit responsive grid columns and a 1120px content cap matching .catalogList.

### Task 2: Add square tile presentation to CatalogRow

**Files:**
- Modify: src/admin/ui/CatalogRow.tsx
- Modify: src/admin/ui/catalog.module.css

**Interfaces:**
- Add optional prop view?: CatalogView, defaulting to list so existing callers retain current output until integrated.
- Tile roots use a 1:1 aspect ratio, rounded corners, full-cover image, bottom gradient, title, and existing metadata.
- Missing images use the section icon on a neutral background.
- Read-only rows keep the entire tile as a link. Actionable rows keep the editor link, status selector, draft badge, and delete dialog independently operable above the image.

**Steps:**
- [x] Keep the existing list branches and classes intact.
- [x] Add tile rendering that reuses existing data and event handlers without nesting interactive controls inside an anchor.
- [x] Add tile-specific image, overlay, text, status, draft, delete, and arrow styles; ensure the tile link remains keyboard-focusable.
- [x] Add a narrow-screen grid rule that keeps two columns when space permits and falls to one column on very narrow widths.

### Task 3: Integrate preferences into tire and wheel catalogs

**Files:**
- Modify: src/admin/tires/TireModelList.tsx
- Modify: src/admin/tires/TireDirectionList.tsx
- Modify: src/admin/wheels/WheelModelList.tsx

**Steps:**
- [x] Add independent keys tire-models, tire-directions, and wheel-models.
- [x] Base each automatic default on the full section collection (for tire models, count models in the selected direction before text/status filters).
- [x] Render the switch beside the existing list filters/header and apply the chosen mode to the collection wrapper and every CatalogRow.
- [x] Preserve empty states, model creation, direction navigation, deletion, publication controls, search, and status filters.
- [x] Leave the initial tire-direction chooser tiles unchanged.

### Task 4: Integrate preferences into shop categories, materials, and pages

**Files:**
- Modify: src/admin/shop/ShopProductList.tsx
- Modify: src/admin/materials/MaterialList.tsx
- Modify: src/admin/pages/PageList.tsx

**Steps:**
- [x] Add independent keys shop-categories, materials, and pages.
- [x] Use unfiltered category/material/page counts for automatic defaults.
- [x] Render the view control and pass view through to each row while leaving existing images, status/draft labels, editors, and filters intact.
- [x] Ensure the switch is in the category listing tab only; do not add it to the category's product list.

### Task 5: Review changes and verify without running tests

**Files:**
- Review only the six list components, shared view hook/control, CatalogRow, and catalog.module.css.

**Steps:**
- [x] Inspect the final diff and confirm no unrelated dirty files were staged or edited.
- [x] Run the repository's TypeScript check only if it is available and does not invoke tests; otherwise report that type checking was not run.
- [x] Do not run tests or create test files unless the user asks.
- [x] Report changed entry points, default thresholds, storage behavior, and verification performed.
