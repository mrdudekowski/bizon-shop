# Public Site Responsive Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit and adapt every public BIZON page family for mobile viewports while preserving the approved desktop composition unchanged.

**Architecture:** Establish mobile route/state evidence and capture desktop as a locked baseline. Approve UX priorities and annotated mobile visuals for every unique section before changing code. Implement mobile-only shared shell/content behavior before page-family behavior, keep route-specific exceptions local, and verify all consumers after shared changes. Choose new mobile interactions only where evidence shows reflow is insufficient.

**Tech Stack:** Next.js App Router, React, CSS Modules, existing browser/device inspection workflow.

**Spec:** `docs/superpowers/specs/2026-10-15-public-site-responsive-design.md`

## Global Constraints

- Scope is `src/app/(site)`; `frontend-cms` is excluded.
- `/selection` is a redirect to `/models`; it is not a separate page.
- Existing desktop composition is approved and out of scope for redesign. Desktop captures are reference/regression evidence only.
- Restrict visual and layout changes to mobile widths at or below 767px. At 768–1023px (tablet) and 1024px+ (desktop), make no composition changes; capture these ranges only as locked references/regression evidence.
- Treat mobile UX and visual hierarchy as the design target: each section must make its purpose and next action clear at phone width.
- Mobile cards show only their decision-critical information; remove secondary copy and reduce decorative/metadata elements. Never remove information required to make a safe product choice; place it on the detail page or in an intentional disclosure.
- Review and approve the annotated mobile visual proposal before product-code implementation; use desktop only as a locked reference.
- Use mobile-first CSS; responsive Grid containers define explicit columns; shrinkable Grid/Flex children use `min-width: 0`; percentage-width elements that must not overflow pair `width: 100%` with `max-width: 100%`.
- Distinguish intended local horizontal scrolling from accidental document overflow.
- Hover cannot carry essential content or actions; respect `prefers-reduced-motion`.
- Do not change CMS data, legal copy, product claims, or API behavior as part of layout work.
- Preserve unrelated working-tree files; stage only explicitly changed paths.

## Review Focus

- 320px viewport and long unbroken text: check that no essential content or action is clipped and that the page itself does not gain accidental horizontal scrolling.
- Long CMS rich-text body, image, link, or table: check wrapping, media bounds, readable table behavior, and article width.
- Product variants and catalog filters: check selected state, URL/history behavior where present, reset/apply controls, and empty results.
- Mobile form keyboard and validation: check focused field visibility, inline error context, submit availability, and success confirmation.
- Touch interaction and reduced motion: check that galleries, carousels, comparison controls, and selector flows remain usable without hover or animation.
- Card content density: check that the phone card has a clear title, only decision-critical facts, and a visible action; secondary copy and decorative elements do not crowd the card.
- Mobile section composition: check section order, image crop/focal point, content hierarchy, and action placement against the mobile visual proposal; confirm desktop is unchanged.

---

## Route inventory

| Family | Routes/states | Primary source files |
|---|---|---|
| Main | `/`, `/models`, `/models/[tireTypeSlug]`, category/model variants at `/models/[tireTypeSlug]/[...segments]` | `src/app/(site)/page.tsx`, `models/**/page.tsx`, `src/components/main/**`, `src/components/catalog/TireCatalog*`, `TireModelStage.tsx` |
| Shop | `/shop`, `/shop/categories`, `/shop/[categorySlug]` catalog/lifestyle variants, wheel list/detail, product detail, delivery/returns | `src/app/(site)/shop/**/page.tsx`, `src/components/shop/**`, `src/components/catalog/WheelModel*`, `WheelOrderPanel*` |
| Requests and cart | `/contact`, `/cart`, `/shop/cart`, drawer, empty/loading/filled/success states | `src/components/forms/**`, `src/components/cart/**`, route page files |
| Service and editorial | `/about`, `/branding`, `/warranty`, `/become-a-supplier`, `/privacy-policy`, `/tire-iq`, `/tire-iq/[slug]`, 404 and unavailable content | `src/components/content/**`, relevant route pages |

## Task 1: Capture responsive UX baseline for every route and section

**Files:**
- Create: `docs/superpowers/reports/2026-10-15-public-site-responsive-baseline.md`
- Inspect: `src/app/(site)/**/page.tsx`

- [ ] Enumerate concrete static and dynamic routes and record the data-dependent variants for each dynamic family.
- [ ] Walk every route and section at 390 CSS px; capture top, major section transitions, and bottom.
- [ ] Capture each page at 1440 CSS px as a locked reference only. Do not propose desktop changes.
- [ ] Check mobile widths 320/360/390/430 for narrow cards, dense controls, long text and forms. Inspect 768/1023 only as locked reference points and 1024/1440 for desktop regression; do not change tablet/desktop composition.
- [ ] For each observation record route, section, user task, viewport, visible impact, reproduction evidence, source/component owner, severity, and whether the issue is a shared or local cause.
- [ ] Record which card text/facts/actions are decision-critical, which items are redundant or decorative, and which details belong on the destination page.
- [ ] Run the supplied viewport and Grid/Flex diagnostics on representative pages; identify intentional carousel/table scrolling separately.
- [ ] Mark unavailable API/CMS-dependent states as unverified instead of substituting fixture output as live evidence.
- [ ] Review the inventory against the route table in the spec; resolve any uncovered route before implementation tasks begin.

**Done when:** Every route and section has a mobile baseline entry or named access limitation; desktop references are captured; findings are prioritized by user impact and tied to a source owner. Card content has an essential/secondary inventory.

## Task 2: Define user flows and annotate visuals for each page family

**Files:**
- Create: `docs/superpowers/reports/2026-10-15-public-site-responsive-visuals.md`
- Reference: `docs/superpowers/reports/2026-10-15-public-site-responsive-baseline.md`
- Reference: `docs/superpowers/specs/2026-10-15-public-site-responsive-design.md`

- [ ] For each route, state the primary user task and the most important decision/action at each section; mark secondary content for deferral, disclosure, or removal from the mobile composition.
- [ ] Provide a visual entry for every unique section in the route inventory; shared section templates may reference one annotated pattern, with route-specific differences called out explicitly.
- [ ] Create annotated mobile section layouts for five families: Main/Tire catalog, Shop discovery, product detail/configuration, forms/cart, and service/editorial/Tire IQ.
- [ ] For every card family (direction, tire model, wheel model, Shop product, category/lifestyle, editorial), define a mobile content budget: title/identity, no more than two decision-critical facts, and action/affordance. Use the baseline to choose the exact facts per family.
- [ ] Show what is removed or moved off each mobile card and where any decision-critical detail remains available. Do not rewrite product claims or published CMS copy without content-owner approval.
- [ ] Annotate image focal point/crop, section order, spacing hierarchy, interaction controls, sticky actions if justified, and empty/error/selected states.
- [ ] Compare proposed 390px layouts with the 1440px locked reference; document mobile-only changes and verify no desktop redesign is proposed.
- [ ] Present the visual proposal for review and wait for approval before starting Tasks 3–7.

**Done when:** The visual report resolves the mobile layout and content-density decisions for every unique section and includes an approved mobile card budget. Desktop remains a read-only reference. No product code has been changed.

## Task 3: Stabilize shared shell, hero, containers, and rich text

**Files:**
- Modify: `src/components/layout/SiteShell.jsx`
- Modify: `src/components/main/MainChrome.tsx`, `src/components/chrome/FloatingChrome.tsx`, `src/components/chrome/FloatingChrome.module.css`
- Modify: `src/components/shop/ShopChrome.jsx`, `src/components/shop/ShopChrome.module.css`
- Inspect: `src/components/Header/Header.jsx`
- Modify: `src/components/DualPaneMenu/DualPaneMenu.tsx`, `src/components/DualPaneMenu/DualPaneMenu.module.css`
- Modify: `src/components/content/PageHero.tsx`, `src/components/content/PageHero.module.css`
- Inspect: `src/components/content/LexicalContent.tsx`
- Modify: `src/app/globals.css` for `.lexical-content` and header base rules when Task 1 confirms those rules own the defect

- [ ] Fix confirmed mobile navigation, menu overlay, cart action and tone-switching issues at shared component level.
- [ ] Set mobile-first width constraints at container and nested item levels; ensure intentional overlays fit the visual viewport and have a usable close/return path.
- [ ] Define PageHero behavior for long titles, multi-level breadcrumbs, optional media, and small viewport heights.
- [ ] Define rich-text behavior for long words/URLs, images, embedded content and wide tables without hiding document-level overflow.
- [ ] Revisit every route using the modified shared contracts and compare with Task 1 baseline.

**Done when:** Shared shell, hero, and rich-text consumers have consistent mobile behavior; the approved desktop composition is unchanged.

## Task 4: Adapt tire direction catalogs, filters, cards, and model detail

**Files:**
- Modify: `src/components/catalog/TireCatalog.module.css`
- Modify: `src/components/catalog/TireCatalogFilters.tsx` (its styles are in `TireCatalog.module.css`)
- Modify: `src/components/catalog/TireDirectionPage.tsx`
- Modify: `src/components/catalog/TireModelCard.tsx`
- Modify: `src/components/catalog/TireModelStage.tsx`
- Modify: `src/components/catalog/CatalogProductGallery.tsx` (its styles are in `TireCatalog.module.css`)
- Modify: `src/components/catalog/TireVariantsTable.tsx`
- Modify: `src/components/catalog/CatalogSpecsTable.module.css`
- Modify: `src/components/catalog/ModelAdvantagesCarousel.tsx`, `ModelAdvantagesCarousel.module.css`
- Verify route owners: `src/app/(site)/models/page.tsx`, `models/[tireTypeSlug]/page.tsx`, `models/[tireTypeSlug]/[...segments]/page.tsx`

- [ ] Adapt `/models`, direction, and category list layouts from the baseline findings, including long breadcrumbs and empty/no-match states.
- [ ] Implement tire filters as a bottom sheet: field groups and draft selections inside; active count in the trigger; sticky Reset and “Показать N моделей” actions at the bottom. Apply commits query state and closes the sheet; reset clears draft/applied state; no-match results remain clear and actionable.
- [ ] Rework tire model cards to the approved mobile content budget: retain model identity and only the facts needed to choose a model; move longer description and secondary badges to the model detail view.
- [ ] Reorder mobile detail content as gallery/title → essential fitment facts → variant selection/primary action → benefits/specifications/documents/contact; keep the primary action inline, and put long description below a “Подробнее” disclosure where appropriate.
- [ ] Make the main product image swipeable and keep thumbnails as a secondary navigation path; auto-scroll the active thumbnail into view.
- [ ] Show core tire specification facts first and put remaining rows behind “Все характеристики”; preserve every value and avoid a phone-wide 14-column table.
- [ ] Verify documents, advantages carousel and final contact CTA at narrow widths and with long labels.
- [ ] Recheck every route variant sharing `TireCatalog.module.css` to catch cross-layout regressions.

**Done when:** Direction/category catalog and model detail routes preserve their complete selection-to-contact task at the baseline widths and all empty/no-match states remain actionable.

## Task 5: Adapt Shop home, categories, wheel catalogs, and product details

**Files:**
- Modify: `src/app/(site)/shop/ShopHome.module.css`, `src/app/(site)/shop/page.tsx`
- Modify: `src/components/shop/ShopCategoriesIndex.tsx`, `ShopCategoriesIndex.module.css`, `ShopCategoryCarousel.tsx`
- Modify: `src/components/shop/ShopCategoryShowcase.tsx`, `ShopCategoryShowcase.module.css`
- Modify: `src/components/shop/ShopLifestyleCategory.tsx`, `ShopLifestyleCategory.module.css`
- Modify: `src/components/shop/ShopProductCatalog.tsx`, `ShopProductCatalog.module.css`, `ShopProductCard.tsx`, `ShopProductCard.module.css`
- Modify: `src/components/catalog/WheelModelGrid.tsx`, `WheelModelStage.tsx`, `WheelVariantsTable.tsx`, `WheelOrderPanel.tsx`, `WheelOrderPanel.module.css`
- Modify: `src/components/shop/ShopProductConfigurator.tsx`, `ShopProductConfigurator.module.css`
- Verify route owners under `src/app/(site)/shop/**/page.tsx`

- [ ] Adapt Shop hero to a mobile height near 75vh, art-directed image crop, and one clear CTA; keep the homepage tire-model section as a swipe-only carousel with a partial next-card peek, no arrows, dots, or autoplay.
- [ ] On Shop home, use compact numbered order-step rows; make vehicle stories a swipe-only carousel with one large story, a partial next-card peek, and captions, without arrows/dots/autoplay.
- [ ] Make the full-bleed Shop category showcase manually swipeable with named progress dots; remove mobile arrows and autoplay. Respect reduced motion and keyboard operation where controls exist.
- [ ] Apply consistent mobile patterns to product catalog and lifestyle category variants, including filter, empty collection, and next-category states.
- [ ] Reduce mobile category, wheel, and Shop product cards to the approved title/facts/action hierarchy; move descriptive copy and secondary badges to the detail view.
- [ ] Implement wheel filters in the same bottom-sheet pattern and draft/apply/reset/query contract as tire filters.
- [ ] Adapt wheel model detail order to image/title → essential fitment facts → order options/action → secondary content; swipe the gallery, keep thumbnails secondary, and disclose non-core specifications while preserving all data.
- [ ] Use compact horizontal Shop product rows on mobile (image left; name, price and existing action on the right); omit long excerpts. Keep variant products’ detail/variant action and simple products’ add-to-cart behavior.
- [ ] Keep product CTA inline after variant/availability, not fixed; collapse only long product stories under “Подробнее о товаре”.
- [ ] Check the mobile-specific image source/crop where provided; confirm the desktop image source and crop remain unchanged.

**Done when:** Every Shop route variant supports product discovery/configuration on narrow screens, with intentional carousel behavior and no hidden filter or purchase action.

## Task 6: Adapt contact forms, cart page, and cart drawer

**Files:**
- Modify: `src/components/forms/ContactExperience.tsx`
- Modify: `src/components/forms/ContextualContactForm.tsx`, `ContextualContactForm.module.css`
- Modify: `src/components/forms/ContactForm.tsx`, `src/components/forms/QuickOrderSection.tsx` (only if Task 1 shows these are active public flows)
- Modify: `src/components/cart/CartPage.tsx`, `CartPage.module.css`
- Modify: `src/components/cart/CartDrawer.tsx`, `CartDrawer.module.css`
- Modify: `src/components/cart/AddToCartButton.tsx`, `AddToCartSection.tsx` if shared action layout is the confirmed cause
- Verify route owners: `src/app/(site)/contact/page.tsx`, `cart/page.tsx`, `shop/cart/page.tsx`

- [ ] Adapt regular and procurement form field groups to a readable mobile order and ensure labels, focus, errors and submit status remain visible.
- [ ] For procurement requests, keep required name/contact/request fields visible and move optional axis/region/term/company/comment fields under “Добавить детали к заявке”; explain that one contact method is sufficient.
- [ ] Verify viewport behavior with the mobile keyboard open and after validation focuses a missing field.
- [ ] Adapt success confirmation and request summary for narrow widths and long contact values.
- [ ] Adapt cart groups and line items for mobile, including quantity changes, removal, mixed item types, empty state and submission state.
- [ ] Verify cart drawer sizing, body scroll, close action, safe areas and return focus at phone widths.
- [ ] Walk both `/cart` and `/shop/cart` plus the add-to-cart transition from the product page.

**Done when:** A user can complete a request from product selection through contact submission using a phone viewport, with empty/error/success states visible and operable.

## Task 7: Adapt service, policy, delivery, and Tire IQ content

**Files:**
- Modify: `src/components/content/ServicePage.tsx`, `ServicePage.module.css`
- Modify: `src/components/content/ArticleLayout.tsx`, `ArticleLayout.module.css`
- Modify: `src/components/content/EditorialListing.tsx`, `EditorialListing.module.css`
- Modify: `src/components/content/TireIqJobNav.tsx`, `TireIqJobNav.module.css`
- Modify: `src/components/content/TireIqApplicationGuide.tsx`, `TireIqApplicationGuide.module.css`
- Modify: `src/components/content/TireIqAxleSelector.tsx`, `TireIqAxleSelector.module.css`
- Modify: `src/components/content/TireIqDumpTruckSelector.tsx`, `TireIqDumpTruckSelector.module.css`
- Modify: `src/components/content/TireIqBusSelector.tsx`, `TireIqBusSelector.module.css`
- Modify: `src/components/content/TireIqVisualLibrary.tsx`, `TireIqVisualLibrary.module.css`
- Modify: `src/components/content/TireIqContextualVisuals.tsx`, `TireIqContextualVisuals.module.css`
- Verify route owners: `about`, `branding`, `warranty`, `become-a-supplier`, `privacy-policy`, `shop/delivery-and-returns`, `tire-iq`, `tire-iq/[slug]`

- [ ] Adapt ServicePage once for its hero, notice, numbered compact feature rows, proof image/copy, child article and CTA; show short descriptions and disclose only long details.
- [ ] Keep legal/privacy and delivery/return/warranty content fully visible. Reduce card chrome/padding and improve reading width; do not collapse legal conditions.
- [ ] Put Tire IQ task navigation first; make bulky application/axle/vehicle selectors mobile disclosures, showing diagrams when opened and preserving selection/result context.
- [ ] Use uniform editorial listing cards (no oversized featured card) with image/date-topic/title and a small open affordance; omit excerpt and redundant “Читать” button on mobile.
- [ ] Adapt article body, media, related links and CTA. Give “Передать задачу специалисту” the primary full-width treatment and “Посмотреть каталог” a quieter text-link treatment.
- [ ] On article tables, stack simple parameter/value pairs; keep wide comparison tables in a bounded horizontal scroller with sticky first label column and a visible scroll cue.
- [ ] Collapse mobile breadcrumbs to nearest parent + current page; retain full breadcrumb on desktop. On mobile footer, collapse navigation groups only; keep brand, main link, contact and legal links visible.
- [ ] Recheck all service pages and article routes after shared component changes.

**Done when:** Service/legal and Tire IQ routes remain readable and task-complete on phones, with all unique selector and CMS content states covered.

## Task 8: Full responsive regression and evidence report

**Files:**
- Update: `docs/superpowers/reports/2026-10-15-public-site-responsive-baseline.md`
- Review: all files modified in Tasks 3–7

- [ ] Repeat every route/section at 390 CSS px; repeat narrow/high-risk cases at 320/360 and the upper mobile width at 430. Inspect 768/1023 as locked tablet references only. Include dynamic variants and relevant form/catalog states.
- [ ] Check 1024px and 1440px as locked desktop references; make no layout changes at these widths or in the 768–1023px tablet range.
- [ ] Compare all routes at 1440px against the locked baseline and document that desktop composition has not changed.
- [ ] Re-run viewport, computed Grid-track, min/max width and child/parent width diagnostics on each page family.
- [ ] Confirm deliberate local scrolling in tables/carousels is operable and distinguish it from accidental page overflow.
- [ ] Check touch interactions, keyboard focus, reduced motion, mobile browser viewport/keyboard behavior, and long CMS content.
- [ ] Record before/after evidence, remaining limitations and whether each result is source, emulation, actual-device, or API/CMS-dependent proof.
- [ ] Reconcile the final report against every route and section listed in the spec; leave no route unaccounted for.

**Done when:** The report provides complete route coverage, concrete post-change evidence, and explicit residual limitations; no P0 finding remains unresolved without a documented blocker.

## Execution and review notes

Tasks 3–7 can be reviewed by page family, but must start only after Task 1 establishes current mobile evidence and Task 2's mobile visual proposal is approved. The user has approved the combined direction: image-led visual treatment from A, catalog clarity from B, and a persistent four-item mobile bottom navigation. Product-code work is authorized for this mobile scope. Task 8 is mandatory after shared component changes. No composition changes are allowed above 767px. Each implementation task must preserve unrelated worktree content and stage only its own files.

## Current implementation status

The mobile-only implementation has started in the shared checkout after the approved mobile UX decisions. Completed and verified slices are recorded in `docs/superpowers/reports/2026-10-15-public-site-responsive-baseline.md` under “Implementation and route recheck”. The 22-route width sweep passed at 320/390/430px; the current focused mobile suite passed 22 tests with its desktop-only regression check skipped, and the separate desktop check passed 1/1. The main tire-model rail verifies as swipe/scroll-snap with a partial next-card preview and no control buttons. Contact validation and mocked API retry/success, Shop cart empty/filled/mixed lines and drawer behavior are covered. Tire IQ axle, truck and bus diagram/choice disclosures are interaction-tested. The short tire-list whitespace defect is fixed at <=767px. The approved four-item Main/Shop mobile bottom navigation is now in the shared shell; live emulation returned 200 on both contexts at 350px, and confirmed the nav is hidden at 1440px. Remaining scope includes tire-cart filled-state review, Tire IQ application-guide and real-data selection-state review, long-content visual review, local table/gallery/Shop-category carousel touch and reduced-motion checks, review of the standard contact form’s optional-field ordering, actual-device keyboard proof, service-boundary validation, and desktop/tablet locked comparison. Desktop compositions above 767px remain out of scope.
