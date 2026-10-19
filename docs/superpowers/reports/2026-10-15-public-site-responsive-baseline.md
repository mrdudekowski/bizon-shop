# Public Site Mobile UX Baseline

**Audit date:** 2026-10-15  
**Scope:** Public routes in `src/app/(site)`; mobile only (<=767px). Tablet (768–1023px) and desktop (>=1024px) compositions are locked.
**Purpose:** Route/section inventory and evidence-backed mobile risks before visual proposal or code changes.

## Evidence boundary

### Fresh 350px visual pass (2026-10-15)

The previous caveats below describe the earlier baseline capture only. A fresh mobile emulation pass is now available at `docs/superpowers/reports/mobile-350-2026-10-15/`: 23 public routes captured at 350 × 820 CSS px (DPR 2, touch enabled), with first-viewport and full-page screenshots. All 23 returned HTTP 200 and reported document width 350px. The new screenshots and complete page-by-page visual scope are in that folder’s `README.md`. This pass found no document-wide horizontal overflow, but does find crowded cards, a branding selector/CTA collision, very long mobile pages, inconsistent mobile hierarchy, and failed media URLs. It is a visual/default-state audit; drawers, filters, selected states, keyboard, and validation states still need interactive captures.

- Failed media observed in the runtime: `/` (3), `/models/tbr` (2), `/shop` (5), `/shop/wheels/forged` (4), `/shop/wheels/forged/atlas` (5), `/shop/product/mega-pritsep` (1), `/tire-iq` (6). The failed URL list is in the route manifest; verify the asset source before selecting fallbacks.
- Screenshots contain the Next.js development “N” badge, which is not product UI.
- At 350px, the route captures are a point-in-time view of local content and current working-tree code. Do not treat HTTP 200 or a width match as proof of interaction quality or correctness at other widths.

- Source review: current route files, page components, and responsive CSS modules for the complete public route inventory.
- Runtime: local Next.js development server returned the home page, `/models`, `/models/tbr`, tire model detail, and `/shop`. Runtime content included published catalog data. Runtime screenshots available in this pass used an uncontrolled desktop-width browser tab; they are not presented as mobile evidence.
- Prior mobile spot-check: the previous browser pass recorded visual checks at 390px for `/`, `/models`, `/models/tbr`, `/models/tbr/long-haul/dsr158`, `/shop`, and `/shop/categories`. Those checks are treated as spot evidence only; they do not establish full route or state coverage.
- Limitation: current `cua_repl` browser API exposed no viewport override. A retained narrow tab repeatedly timed out when accessed. Therefore this report does not claim a fresh, fully instrumented 390px pass or computed-style diagnostics in this turn. Before code work, use a controllable mobile viewport and collect the per-route screenshots/width diagnostics called for in the plan.
- No P0 defect is declared confirmed from the available evidence. P1 items below are source-backed risks and/or mobile spot-check findings to verify against the fresh baseline.

## Severity method

- **P0:** mobile visitor cannot complete a primary task or reach essential content.
- **P1:** mobile task remains possible but is materially slower, unclear, crowded, or error-prone.
- **P2:** visual polish, rhythm, crop, or secondary-motion issue without a material task barrier.

## Highest-priority mobile findings

| Priority | Area | Evidence | User impact | Proposed mobile direction |
|---|---|---|---|---|
| P1 | Direction and model cards | `/models` currently renders title, count/status, and description in one image card. `TireCatalog.module.css` also puts application/axle metadata, title, full description, and footer in each tire card; description has no mobile line limit. | Several competing content layers slow scanning and make cards tall; the user has to open cards to compare details anyway. | One visual focal point; keep title plus up to two task-critical facts and one clear affordance. Remove the general paragraph and secondary badges from mobile cards; retain full data on the detail route. |
| P1 | Tire catalog filters | Three full-size controls plus submit and reset are always rendered. They stack into a single column at <=767px. | Filters can dominate the first mobile viewport and push results far below the heading. | Approved: open a bottom sheet with draft fields, active count, sticky reset/apply, result count in “Показать N моделей,” and preserved URL/query behavior. |
| P1 | Mobile tire specification cards | `CatalogSpecsTable.module.css` displays every variant as a card below 768px; each card includes a two-column facts grid and many specification fields. | The mobile alternative avoids horizontal scrolling but can itself become a dense multi-row data card. | Keep size plus a small set of purchase/fitment-critical values visible; provide a deliberate “Все характеристики” expansion for remaining values. Do not delete technical data. |
| P1 | Shop product grid near 390px | `ShopProductCatalog.module.css` retains two columns through 390px and switches to one only at <=389px. Each product card carries category, title, description, price, and action. | A one-pixel breakpoint changes card width sharply; near 390px each card is narrow while still carrying the full desktop text stack. | Approved: use a stable compact horizontal row across mobile widths. Drop long description/redundant category label from the row; keep variant and full description on product detail. |
| P1 | Shop home density | Shop home has three wheel cards, three order-step cards with descriptions, a category carousel, and five vehicle-story images. | Multiple content-heavy blocks appear in sequence; dense mobile cards and five adjacent visual stories can make the page feel long and repetitive. | Approved: compact wheel cards, numbered order rows, manually swiped category showcase with named dots/no arrows/autoplay, and swipe-only vehicle-story cards with a partial next-card peek. |
| P1 | Wheel filter panel | `WheelModelGrid` can expose up to eight parameter selects plus submit and reset in one form. | On mobile, the filter controls can overwhelm browsing and make result cards hard to reach. | Approved: same bottom-sheet interaction as tire filters, with draft values, selected count, apply result count/reset and preserved query semantics. |
| P1 | CMS rich text | `LexicalContent` renders rich text shared by model, product, and article pages; responsive constraints are primarily global. | A single wide table, long URL, or oversized image can break reading width or force accidental page overflow. | Constrain media and long strings; tables become labeled cards or an intentional local scroll region. Keep article line length readable and test real long content. |
| P1 | Mobile nav distinction | Main and Shop have separate chrome configurations; Shop exposes category navigation, request, returns, and cross-site link in its navigation structure. | Distinct menus can drift in trigger sizing, close behavior, focus return, and information hierarchy. | Preserve separate information architecture and two-step drawer; align touch targets, close/back, focus return and safe-area behavior. |
| P1 | Product detail action flow | Tire/wheel detail puts gallery, facts, selection/order panel, advantages, table, documents, and final CTA on one long page. Product configurator stacks gallery and details <=900px. | Required selection and add/request action can be buried in long explanatory sections; desktop composition may not map to the most useful mobile order. | Put title, one-sentence context, gallery, essential facts, options and primary action in a concise sequence. Defer secondary advantages/documents below the action. Keep all required fitment data available before order. |
| P2 | Editorial and service cards | Editorial tiles combine image, metadata, long title, excerpt, and read link; ServicePage uses numbered features and proof imagery. | Repeated excerpt and CTA add weight to otherwise scan-friendly mobile lists. | Editorial card: title, one topic/metadata item, one action; omit excerpt on mobile when it repeats the article lead. Service steps become short numbered rows; avoid enclosing each in a large card if a list reads faster. |
| P2 | Motion and visual crop | Home hero and branding compare have scroll/touch/motion behavior; Shop category carousel auto-plays unless reduced motion is enabled. | Motion may compete with reading or interfere with touch navigation; image crop may hide product focal point at narrow ratios. | Approved mobile carousels are manual: swipe-only where specified; category showcase uses named dots and no autoplay/arrows. Art-direct existing assets first and preserve reduced-motion behavior. |

## Route and section inventory

The mobile treatment below applies to every listed section. Repeated component templates are counted once for design, then verified on every route using them.

| Route | Sections / states to cover | Mobile UX / visual treatment |
|---|---|---|
| `/` | Main hero; tire model carousel; branding before/after comparison; Shop campaign; expertise banner; footer | Add a mobile-only catalog CTA. Keep tire models as swipe carousel with partial next-card peek, no controls/autoplay. Comparison is a separate bounded image interaction with copy/CTA below. Campaign/expertise: one message/action. Collapse only footer navigation groups. |
| `/models` | Direction card list; empty catalog/contact state | Direction card: title and compact count/status; omit descriptive paragraph from mobile card. Empty state: clear explanation and one primary contact action. |
| `/models/[tireTypeSlug]` | Breadcrumbs/title; filters; result header; tire model cards; zero-model/no-match states | Filter bottom sheet with draft/apply/reset and “Показать N моделей”; cards show model, application and one fitment/size cue, not full description or redundant badges. |
| `/models/[tireTypeSlug]/[...segments]` category | Deeper breadcrumbs; category title; locked application; same filter/results/cards/states | Show nearest parent/current page; surface locked application in the filter sheet summary. Reuse the approved filter and card patterns. |
| `/models/[tireTypeSlug]/[...segments]` model | Breadcrumbs/title; gallery; facts; order panel; advantages carousel; variants; documents; CTA | Gallery/title → essential fitment → selection/action → secondary content. Main image supports swipe; thumbnails are secondary. Show core specs first and disclose remaining values. |
| `/shop` | Hero; wheel model cards; three order steps; category showcase; five vehicle images; footer | Keep one visual story per viewport: hero, wheel choice, steps, category, stories. Cards use title + one fact + action; steps as numbered list. Avoid displaying several story images simultaneously on narrow phone. |
| `/shop/categories` | Category hero carousel; category-card catalog | Manual swipe with named progress dots; no mobile arrows/autoplay. Opened category rail shows names, not icons alone. |
| `/shop/[categorySlug]` product catalog | Breadcrumbs/title; subcategory filter; products; empty result; back link | Compact horizontal product rows at all mobile widths; image/name/price/current action; omit long description. |
| `/shop/[categorySlug]` lifestyle | Hero/breadcrumbs; approach principles; collection/empty state; next-category feature | Hero: one claim and one anchor action. Principles become short numbered rows or disclosures. Collection cards follow the mobile content budget. Next-category acts as a single end-of-page navigation tile. |
| `/shop/wheels/[wheelTypeSlug]` | Title; wheel filters (up to eight); result count; wheel cards; empty result | Shared bottom-sheet filter with draft/apply/reset/query preservation. Cards show model, one style/series fact and open action. |
| `/shop/wheels/[wheelTypeSlug]/[modelSlug]` | Breadcrumbs; gallery; facts; order panel; variant table; documents | Gallery → title/facts → parameter selection and primary request action → full specifications/documents. Compact supporting information; no oversized fixed desktop columns. |
| `/shop/product/[productSlug]` | Breadcrumbs; gallery/thumbnails; title/description; price; color/size/configuration; availability; CTA; long story | Main image swipe plus secondary thumbnails. Keep price/options/availability/inline CTA together. Collapse only long story; listing cards omit long description. |
| `/contact` | Contextual hero; standard/procurement form; validation/loading/error/success | Group fields by contact and request context, one column on phone. Keep labels visible and errors adjacent. Success summary is compact and next step obvious. No sticky submit while keyboard obscures fields unless proven useful. |
| `/about` | Service hero; optional notice; operating principles; proof image; CTA | Hero then short numbered principles; proof image/copy stack; one CTA. Use no card-specific filler. |
| `/branding` | Service hero; project stages; proof; contextual CTA | Same service template; stages become short steps. Keep the branding CTA visible after the explanation. |
| `/warranty` | Service hero; demo notice; three intake steps; proof; CTA | Notice visible without monopolizing the first screen; concise step titles, detailed instruction remains below/in disclosure; direct contact action. |
| `/become-a-supplier` | Service hero; contact steps; proof; CTA | Short numbered steps; single proof image; one clear application action. |
| `/privacy-policy` | Hero; legal notice; summary; full legal article | Readable text column, stable headings, wrapped long addresses/emails, no legal text hidden merely to shorten page. |
| `/shop/delivery-and-returns` | Heading/breadcrumbs; notice; order, delivery, return cards | Stack as compact policy sections with clear headings; preserve complete conditions and links. |
| `/tire-iq` | Hero; job navigation; application guide; axle/truck/bus selectors; topic chips; featured and regular knowledge cards; empty state | Task nav first; selectors collapsed until opened, diagrams inside open selector. Uniform article cards with image/date-topic/title and affordance; no excerpt. |
| `/tire-iq/[slug]` | Article hero; image/meta/aside; contextual visuals; rich-text article; related models; next step; back link | Narrow reading column; specialist contact is the main CTA, catalog secondary. Simple tables stack; comparison tables scroll locally with sticky first column. |
| `/cart`, `/shop/cart` | Loading; empty; mixed populated groups; quantity/remove; request form; success/error | Retain all item/variant details needed to submit the right request. Present each line item as a compact row, not a marketing card; quantity and remove controls remain separate and touchable. Keep totals and primary submit action in a clear group. |
| `not-found`, unavailable content | Error/empty explanation; recovery/contact action | One short reason and one recovery action. Distinguish temporary catalog failure from a genuinely empty catalog. |

## Route-by-route walkthrough and issue register (15 October 2026)

This follow-up separates browser observations from source-backed mobile risks. A CSS/source finding means the current implementation contains the described behavior; it is not a claim that a screenshot proved visual severity. P0 requires a demonstrated task blocker. No P0 was demonstrated in this pass.

### Browser observations at 390 CSS px

| Route | Runtime result | Confirmed mobile observation |
|---|---|---|
| `/` | HTTP 200; rendered | `innerWidth`/document client width were 390; document scroll width was 390. No page-wide horizontal overflow. |
| `/models` | HTTP 200; rendered | Widths were 390; direction sections and basket rendered; no page-wide overflow. |
| `/models/tbr` | HTTP 200; rendered | Widths were 390; title and three model cards rendered; no page-wide overflow. |
| `/models/tbr/long-haul/dsr158` | HTTP 200; rendered | Widths were 390; model, benefits, variants heading and contact section rendered; no page-wide overflow. |
| `/shop` | HTTP 200; rendered | Widths were 390; no document overflow. The next wheel carousel card extends beyond the viewport (intentional preview); it is not document-level overflow. |
| `/shop/categories` | HTTP 200; rendered | Widths were 390; hero and category section rendered; no page-wide overflow. |

Page-level width checks are not a substitute for visual/touch checks. The browser session could not reliably set the in-app browser viewport, so Playwright emulation was used for these six routes. Several other dynamic routes stalled around the app's ~30-second server fetch interval; do not treat that latency as a responsive defect. No keyboard, actual-device, filter interaction, form submission, or dynamic CMS empty/error state was verified in this pass.

### Findings by route and section

| Route / section | Recorded problem or risk | Priority and evidence |
|---|---|---|
| `/` — hero | There is no catalog CTA in the current hero. On phone, the first visible section therefore gives no direct next step into models. Add a mobile-only “Перейти в каталог” action and art-direct the crop around it. | **P1, source-backed** — `MainHero`; independently approved mobile direction. Browser confirmed route renders at 390px, not CTA usability. |
| `/` — tire models | Current desktop-like card face carries secondary description/labels. Cards become tall and harder to scan at phone width; keep identity, one key fact and open affordance in a swipe carousel with a visible next-card edge, no buttons/arrows/dots/autoplay. | **P1, source-backed** — `TireCatalog.module.css` / main model showcase. Browser confirmed no page overflow, not card readability. |
| `/` — branding comparison | The draggable comparison shares its space with copy/CTA. On a narrow screen, text competes with the touch surface and can cover the focal subject. Separate the bounded image/slider from headline, explanation and CTA below. | **P1, source-backed risk** — `BrandingCompare`; touch target and crop not runtime-verified. |
| `/` — Shop/expertise campaigns and footer | Campaign content must remain one message/one action; footer link groups are all expanded today, producing a long navigation block. Collapse navigation groups only; keep contact and legal links visible. | **P2, source-backed** — Main campaign/footer components. Browser page height not visually reviewed. |
| `/models` — direction cards / empty state | Direction cards put descriptive copy inside image cards. That duplicates the destination page and increases card text density. Keep title/count-status and one opening affordance. Empty state still needs one clear contact action. | **P1, source-backed** — direction card styles; 390px route and headings rendered. Empty state not exercised. |
| `/models/[tireTypeSlug]` (observed `/models/tbr`) — heading, filters, results/cards | Three full-size controls plus submit/reset remain in the page flow; model cards include full descriptions and badges. This pushes results down and makes comparison slower. Replace with a bottom sheet and shorter cards; apply should preserve query state and return the result count into view. | **P1, source-backed** — `TireCatalogFilters`, `TireCatalog.module.css`; route rendered at 390px, interactions not exercised. |
| `/models/[tireTypeSlug]/[...segments]` — category variant | Deep breadcrumb and locked application context can consume the mobile heading area; shared filter and card density risks also apply. Show nearest parent/current page and make locked application visible in the filter summary. | **P1, source-backed shared risk** — catch-all route and shared catalog components. Specific category slug/state not independently captured. |
| `/models/[tireTypeSlug]/[...segments]` — model variant (observed `/models/tbr/long-haul/dsr158`) — gallery, selection/order, benefits, specs/documents | All 13 tire variant fields can become dense specification cards; the user has to scan many rows to find fitment-critical values. Keep key facts/selection/action first; disclose remaining specs. Long description/benefits/documents should follow the primary decision. | **P1, source-backed** — `TireVariantsTable`, `CatalogSpecsTable.module.css`, `TireModelStage`; route rendered at 390px, touch order not verified. |
| `/shop` — hero | Hero keeps a `100svh` mobile minimum, delaying the next section by roughly one phone screen. Reduce mobile height to about 75svh, preserve the image, and keep title/lead/CTA readable over an art-directed crop. | **P1, source-backed** — `ShopHome.module.css` mobile rule; route rendered at 390px, visual crop not reviewed. |
| `/shop` — wheel model choice | The swipe carousel is already present and the next-card peek works without widening the document. Card height is at least 420px on narrow phones and carries series/style/made-to-order copy; lower visual burden to image, title, one decision fact/action and reduce unnecessary height. | **P1, source-backed + browser width check** — `ShopHome.module.css`; intentional edge overflow at 390px. |
| `/shop` — order steps | Three step cards each include explanatory paragraph, repeating the same card structure in a vertical mobile flow. Keep number/title as rows; expand detail only when needed. | **P1, source-backed** — Shop home step markup/styles. |
| `/shop` — category showcase | Current mobile category control exposes an icon-only rail; carousel also has autoplay/arrows. Names are needed for category recognition; change rail to labeled names and use manual swipe + named progress dots, no arrows/autoplay. | **P1, source-backed** — `ShopCategoryShowcase`, `ShopCategoryCarousel`; page rendered at 390px, controls not interacted with. |
| `/shop` — vehicle stories | Five full image stories are shown as a grid at desktop and add substantial vertical image weight. Use a swipe-only one-at-a-time carousel with caption and partial next-card hint. | **P1, source-backed** — `ShopHome.module.css`; exact mobile visual not screenshot-reviewed. |
| `/shop/categories` — hero carousel / category rail | Hero content is image-led; the category navigation shortcut is icon-only until opened. Add visible category names in the opened mobile rail. Keep category carousel swipe plus named progress dots and no autoplay/arrows. | **P1, source-backed** — `ShopCategoryShowcase`; route rendered at 390px, controls/crop not tested. |
| `/shop/[categorySlug]` — product catalog | Grid is two columns through 390px and flips to one column at 389px. Each card contains category, name, description, price and action; this creates a sharp one-pixel layout shift and dense narrow cards. Use one stable compact horizontal row at all mobile widths, omit long excerpt, preserve existing variant/add behavior. | **P1, source-backed** — `ShopProductCatalog.module.css`, `ShopProductCard.tsx`; correct CMS category state not captured. |
| `/shop/[categorySlug]` — lifestyle variant | Lifestyle principles, collection product cards and next-category tile are stacked; principle explanations and product excerpts compete with the product decision. Use compact title rows/disclosures and the same compact product-row budget. | **P1, source-backed** — `ShopLifestyleCategory`, `ShopProductCard`; live category content not captured. |
| `/shop/wheels/[wheelTypeSlug]` (observed slug `forged`) — filters/results/cards | Up to eight selects, submit and reset render directly above results; initial load also starts filter state from query. This dominates phone browsing. Use the shared bottom sheet with draft values, selected count, apply-count label and reset; verify native URL/query behavior is retained. | **P1, source-backed** — `WheelModelGrid.tsx`, filter styles. Request eventually returned HTTP 200 but the browser navigation timed out before DOM diagnostics; visual state unverified. |
| `/shop/wheels/[wheelTypeSlug]/[modelSlug]` (observed slug `forged/atlas`) — gallery/order/specifications | Gallery, order panel and all variant parameters need the same mobile prioritization as tire detail. Put fitment facts and request action before secondary copy; disclose non-core specs and support direct image swipe. | **P1, source-backed** — `WheelOrderPanel`, `WheelVariantsTable`; page data/browser state not captured before timeout. |
| `/shop/product/[productSlug]` — gallery/configuration/long story | The product card currently retains a long description; product detail has option/availability/action and a long story. The action is inline, which is appropriate; reduce listing density and collapse only the long story on mobile. Gallery needs swipe with thumbnails as secondary controls. | **P1, source-backed** — `ShopProductCard`, `ShopProductConfigurator`; valid product slug not established in this pass. |
| `/contact` — standard form | Keep one contact method sufficient, visible labels/errors and submit feedback. Keyboard/focus and success/error states were not exercised. | **P1 verification gap** — `ContextualContactForm`; no browser state captured. |
| `/contact?subject=procurement` — procurement form | Five additional procurement fields (size, quantity, axle, region, term) are rendered together before name/contact; optional company/comment also remain in the same form flow. Optional details should move under “Добавить детали к заявке”; keep required size/quantity/contact/request context visible. | **P1, source-backed** — `ContextualContactForm.tsx`; form not rendered in browser during this pass. |
| `/cart`, `/shop/cart` — loading/empty/filled/request | Each state requires touch access to quantity/remove and visible submit/summary. No cart state was loaded, so state-specific defects remain unknown. | **P1 verification gap** — `CartPage`, `CartDrawer`; route/state not captured. |
| `/about`, `/branding`, `/warranty`, `/become-a-supplier` — hero/notice/steps/proof/CTA | Shared service pages repeat feature descriptions in card-like blocks. On mobile these add vertical weight before proof and CTA. Use compact numbered rows, retain short instructions and disclose only long detail. | **P2, source-backed** — `ServicePage`; page routes not browser-verified in this pass. |
| `/privacy-policy`, `/shop/delivery-and-returns` — notice/legal/policy sections | Legal/transactional conditions must remain fully visible; likely issue is card chrome/padding and long reading width, not text amount. Validate long strings and links; do not collapse terms. | **P2 verification gap** — `LexicalContent`/policy page components; route content not captured. |
| `/tire-iq` — job nav/selectors/results/articles | Job links, application guide and axle/truck/bus selectors precede the knowledge list. This makes the task flow long before a user sees results; progressively disclose selectors and show diagrams only when a selector is open. Listing cards also repeat excerpt and action. | **P1, source-backed** — `TireIqJobNav`, selector components, `EditorialListing`; browser state not captured. |
| `/tire-iq/[slug]` — article/related models/next step | The article layout has related models and two same-weight actions; on phone, contact specialist should be primary and catalog a quieter secondary link. Wide CMS tables need local bounded scroll or stacked key/value pairs. | **P1, source-backed** — `ArticleLayout.tsx`, `LexicalContent`; valid article route and CMS body not captured. |
| All public routes — header/menu/breadcrumb/footer | Main and Shop use separate chrome; ensure the two-step drawer remains easy to close/back through. Breadcrumb depth consumes width; footer navigation groups are expanded. On mobile collapse breadcrumbs to parent/current and navigation groups only; leave contact/legal links visible. | **P1 shared risk / P2 footer** — `DualPaneMenu`, chrome, `PageHero`; menu interaction not tested. |
| Not-found / unavailable content | Correct recovery action differs between invalid route, empty catalog and unavailable CMS content. Do not conflate states. No unavailable CMS response was forced. | **P1 verification gap** — route boundaries/fallback components; not triggered. |

### Critical issues and refactor boundaries

1. **P1 — Mobile card content contract (shared + family variants).** `CatalogCard`, `TireModelCard`, and `ShopProductCard` should own concise mobile summaries; descriptions and repeated badges move to detail/disclosure. This is a component/data-presentation refactor, not arbitrary font reduction.
2. **P1 — Filter interaction refactor (tire + wheel).** Current tire controls are always in-flow; wheel filters are a multi-select form with local state and GET submission. A shared visual bottom-sheet contract is needed, while each catalog must preserve its existing query semantics. Do not merge filter state/API contracts without a separate reason.
3. **P1 — Mobile product decision flow.** Tire/wheel/product detail pages need one sequence: image/title → compatibility facts → option/variant selection → inline primary action → secondary content. Specification disclosure is a structural behavior change; retain all technical values.
4. **P1 — Shop category/catalog presentation.** Remove the 390/389 layout cliff and redesign the mobile product card as a horizontal row. Named category access must replace icon-only shortcuts; motion controls must match the approved interaction for each carousel.
5. **P1 — Request-entry complexity.** Procurement optional fields need progressive disclosure; test keyboard, validation and focus on a real mobile viewport.
6. **P1 — Long-form content and navigation.** Treat tables, breadcrumbs and drawers as shared primitives; prevent page-level overflow while retaining intentional local scroll.

### Unverified route/state list

The following need a controllable mobile viewport and valid published data before implementation acceptance: valid `/shop/[categorySlug]` catalog and lifestyle variants; wheel list/detail with computed diagnostics; valid Shop product detail; `/contact` regular/procurement plus keyboard/error/success; empty/filled `/cart` and `/shop/cart`; each service/legal route; Tire IQ listing/article with long CMS tables and empty state; 404 and published-content-unavailable state. Do not mark these as passed based only on source review or HTTP status.

## Mobile card content budgets

| Card family | Keep visible on mobile | Remove/defer from card |
|---|---|---|
| Tire direction | Direction name; compact count/status | Paragraph description; repeated category language |
| Tire model | Model name; application; one size/fitment cue; open action | Long description; duplicated axle/application badges; secondary specs |
| Wheel model | Name; one style/series fact; made-to-order status only if decision-relevant; open action | Repeated brand/category labels; long description; extra badges |
| Shop product | Image; name; price/price-on-request; essential availability cue; open/configure action | Long product description; repeated category label; secondary promotions unless they affect decision |
| Lifestyle/category | Category title; image; one short positioning cue if useful; open action | Multiple principles and full explanatory text |
| Editorial | Article title; one topic/date; read action | Excerpt when it repeats the lead; duplicate read links |
| Order step / service feature | Number; action-oriented title | Full paragraph in a card. Keep essential instructions in a compact list or explicit disclosure. |

Card budgets are starting constraints, not permission to omit required compatibility, price, or order information. Final facts are selected using each flow's actual decision and then confirmed in the visual proposal.

## UX decisions already confirmed for implementation

1. Tire and wheel filters use one bottom sheet pattern with draft values, active count, reset, apply-count label, query-state preservation and close-on-apply behavior.
2. Shop product listings use compact horizontal rows at all mobile widths; preserve the current simple-product add and variant-product choose flow.
3. Tire/model cards use a strict mobile content budget; specifications keep all data but disclose secondary rows.
4. Home tire carousel is swipe-only with a next-card peek and no arrow buttons/dots/autoplay. Shop category showcase uses swipe + named dots and no arrows/autoplay. Shop vehicle stories use swipe-only with next-card peek.
5. Legal/transactional text remains visible. Only long non-legal detail is collapsed. Service/editorial cards reduce repeated text; article next-step has one strong specialist CTA.

## Implementation priority proposal

- **First:** shared mobile shell/menu, card content hierarchy, tire/wheel filter experience, product detail action order, technical data usability, request/cart completion.
- **Second:** homepage and Shop section rhythm, image crop and category/story treatment, Tire IQ selectors and article cards.
- **Third:** service page typography, footer grouping, secondary decorative transitions.

All items remain mobile-only at <=767px. Verify 768/1023px as locked tablet references and 1024/1440px as desktop references; do not redesign above 767px.

## Implementation and route recheck — 2026-10-15

### Verified in browser emulation

- Added a Playwright route sweep covering 22 built static routes at 320, 390, and 430 CSS px. All inspected routes finished without document-level horizontal overflow after the fixes below. This is Chromium emulation against the CI static export, not actual-device proof or live CMS/API proof.
- Added focused mobile interaction checks for compact Shop product rows; tire and wheel bottom-sheet filtering, including draft-count and query apply; tire model summary density; core/secondary tire specifications; Shop mobile hero height and order-step disclosure; procurement optional details; editorial excerpt removal and specialist CTA order.
- Latest successful build: `npm run build:ci` after the narrow catalog spacing adjustment. Full focused mobile responsive suite: 22 passed, 1 desktop-only check skipped in the mobile project; separate desktop regression passed (1/1). The full 22-route sweep at 320/390/430px passed. The main page tire model rail is now verified as horizontal CSS Grid with scroll snap, a partial next-card preview, and no button controls.
- `git diff --check` passed (Git emitted only LF→CRLF working-copy notices).

### Fixed from observed narrow-width failures

- Home `/` at 320px: the large assortment heading's intrinsic width enlarged the document; constrained the mobile heading/container and added the mobile-only catalog CTA to the main hero.
- `/shop/outdoor` at 320px: lifestyle hero and internal grids allowed intrinsic content width to escape the viewport. Added explicit mobile grid tracks and min/max sizing. Shared mobile menu overlay is now bounded to the viewport; the floating back-to-top control is inset on narrow phones.
- `/about` at 320px: PageHero long title and ServicePage proof heading overflowed; added mobile wrapping and box-sizing constraints.
- Shared route sweep passed after these corrections at 320/390/430px.

### Implemented mobile patterns with focused checks

- Shop product cards become compact horizontal rows through 767px; descriptions and redundant category labels are removed from the row.
- Tire and wheel filters open a shared bottom sheet with draft values, live count, reset/apply controls, close/focus/scroll handling, and GET query preservation.
- Tire model cards drop long copy and repeated facts; tire/wheel technical tables place secondary fields in disclosures.
- Shop home uses a shorter mobile hero, compact order steps, a swipe-only vehicle story rail, and reduced wheel model card height. Category showcase has labeled mobile shortcuts and hides mobile arrow/pause controls; autoplay stops at phone width and reduced-motion preference.
- Mobile product gallery accepts horizontal pointer swipes while retaining thumbnail controls.
- Mobile Main hero has a full-width “Перейти в каталог” action. Branding comparison image is separated from copy on mobile; desktop rules remain outside the mobile media query.
- Tire IQ job navigation hides supporting outcomes on phones. Editorial cards use one compact format without excerpts/duplicate read action; the specialist CTA precedes the quieter catalog link.
- Procurement form keeps size, quantity, name and one contact method in the main flow; axle, region, term, company and comment are grouped under “Добавить детали к заявке”.
- Mobile Tire IQ selectors disclose diagrams and choice lists on demand; selection links remain visible after opening.
- Mobile footer collapses navigation groups while keeping brand, contact and legal links visible. Breadcrumbs retain only nearest parent and current page on phone; desktop route trail remains visible.
- Tire and Shop product detail pages keep fitment/order actions ahead of long descriptions and disclose supporting copy on mobile; the desktop disclosure content remains visible.
- Rich-text tables are bounded to local horizontal scrolling with a pinned first column; mobile content width constraints are applied to the shared reading surface.
- `/cart` and `/shop/cart` empty states, a filled Shop request, and its one-column checkout fields fit 390px. The cart drawer opens/closes on phone, traps/returns focus, and releases the body scroll lock after Escape.
- Contact form validation focuses the first required input below the fixed header after smooth scrolling; one contact method is sufficient. Mocked API retry checks preserve entered values after an error and show a narrow success summary.
- Shop cart mobile checks cover separate wheel/product groups, quantity editing, line removal, API error retention, and success-only clearing of submitted items.
- Full-page screenshots were inspected at 390px for `/`, `/shop`, `/models/tbr`, `/shop/categories`, `/tire-iq`, and `/contact`. On `/models/tbr`, one result card sat 197px above the footer because the mobile catalog enforced a full-viewport minimum height and centered its content. The mobile catalog now uses content height and top alignment; the same measurement is at most 140px. This CSS adjustment is limited to widths <=767px.

### Remaining work and evidence gaps

- Bottom filter sheets, footer grouping and breadcrumb shortening are implemented and interaction-tested in Chromium emulation. The user has now approved the persistent mobile bottom navigation direction; it is being added to the shared shell with separate Main/Shop destinations and safe-area spacing.
- Tire IQ axle, dump-truck and bus diagram/choice disclosures are implemented and interaction-tested on the CI fixture route; keyboard focus on a selected axle updates the matching diagram. Application guide and preservation of selection/result state across real CMS data still need review.
- Tire and Shop product detail action ordering and story disclosure are checked on fixture routes. Wheel detail, all product image carousel interactions, and full spec/card states need route-specific review. The gallery pointer swipe is source/build checked but not directly gesture-tested.
- Shop cart empty/filled/mixed states, quantity/removal, request error/success and drawer close are covered in emulation. Tire cart filled-state behavior and service-boundary validation remain unverified. The actual on-screen keyboard is not available in Playwright desktop emulation; native validation focus/scroll was checked, but a physical-device keyboard pass remains open.
- Service/editorial/legal page visual rhythm and long rich-text content still need section-by-section visual review. The route sweep asserts document width, not visual quality or task completion; wide-table local scrolling still needs a touch check. Shop category carousel touch progression and reduced-motion state have not yet been asserted in E2E.
- On `/contact`, the optional Company field appears before phone and email, pushing the contact methods lower in the mobile form. This is a remaining UX ordering opportunity; no copy or desktop field order has been changed.
- Main hero/product cards, Shop category tiles, and editorial images on these static screenshots can be placeholders because the build uses CI fixture content. Treat this as a limitation of the visual evidence, not a production asset defect.
- Category showcase dots/swipe, wheel/tire filter focus restoration/escape/backdrop, reduced-motion behavior, and 768/1023 plus 1024/1440 locked visual comparison still need explicit checks. No actual-device proof was collected.
- Live CMS content may have longer titles, tables, images, or missing data than the CI fixture; dynamic variants and unavailable-content state remain separate verification work.
