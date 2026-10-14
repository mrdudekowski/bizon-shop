# Public Site Mobile UX Baseline

**Audit date:** 2026-10-15  
**Scope:** Public routes in `src/app/(site)`; mobile only. At 1024px and above, the approved desktop composition is locked.  
**Purpose:** Route/section inventory and evidence-backed mobile risks before visual proposal or code changes.

## Evidence boundary

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
| P1 | Tire catalog filters | Three full-size controls plus submit and reset are always rendered. They stack into a single column at <=767px. | Filters can dominate the first mobile viewport and push results far below the heading. | Compact “Фильтры” trigger with active-filter count; open a labeled sheet or disclosure, preserve reset/apply and URL query behavior, return results count to view after apply. Validate sheet only if the baseline confirms first-screen displacement. |
| P1 | Mobile tire specification cards | `CatalogSpecsTable.module.css` displays every variant as a card below 768px; each card includes a two-column facts grid and many specification fields. | The mobile alternative avoids horizontal scrolling but can itself become a dense multi-row data card. | Keep size plus a small set of purchase/fitment-critical values visible; provide a deliberate “Все характеристики” expansion for remaining values. Do not delete technical data. |
| P1 | Shop product grid near 390px | `ShopProductCatalog.module.css` retains two columns through 390px and switches to one only at <=389px. Each product card carries category, title, description, price, and action. | A one-pixel breakpoint changes card width sharply; near 390px each card is narrow while still carrying the full desktop text stack. | At mobile widths choose a stable one-column compact card or a compact image/title/price row. Drop the description from the mobile card unless it is necessary to choose; keep variant and full description on the product page. Decide from 320/360/390 visuals, not breakpoint habit. |
| P1 | Shop home density | Shop home has three wheel cards, three order-step cards with descriptions, a category carousel, and five vehicle-story images. | Multiple content-heavy blocks appear in sequence; dense mobile cards and five adjacent visual stories can make the page feel long and repetitive. | Wheel cards: title, one design/series fact, made-to-order state only if needed, open action. Steps: compact numbered list with title; omit repeated explanatory copy from the mobile tile or move it to a disclosure. Keep the category hero as one large focused carousel. Show vehicle stories one at a time in an accessible mobile carousel or a short curated row; do not create a second competing gallery. |
| P1 | Wheel filter panel | `WheelModelGrid` can expose up to eight parameter selects plus submit and reset in one form. | On mobile, the filter controls can overwhelm browsing and make result cards hard to reach. | Single “Параметры диска” trigger, active count/chips, grouped fields in a sheet, apply/reset, clear no-result state. Preserve current URL/filter semantics; do not add a second filter state model. |
| P1 | CMS rich text | `LexicalContent` renders rich text shared by model, product, and article pages; responsive constraints are primarily global. | A single wide table, long URL, or oversized image can break reading width or force accidental page overflow. | Constrain media and long strings; tables become labeled cards or an intentional local scroll region. Keep article line length readable and test real long content. |
| P1 | Mobile nav distinction | Main and Shop have separate chrome configurations; Shop exposes category navigation, request, returns, and cross-site link in its navigation structure. | Distinct menus can drift in trigger sizing, close behavior, focus return, and information hierarchy. | Preserve separate information architecture but use one mobile drawer interaction contract, clear top-level destinations, and a concise category hierarchy. |
| P1 | Product detail action flow | Tire/wheel detail puts gallery, facts, selection/order panel, advantages, table, documents, and final CTA on one long page. Product configurator stacks gallery and details <=900px. | Required selection and add/request action can be buried in long explanatory sections; desktop composition may not map to the most useful mobile order. | Put title, one-sentence context, gallery, essential facts, options and primary action in a concise sequence. Defer secondary advantages/documents below the action. Keep all required fitment data available before order. |
| P2 | Editorial and service cards | Editorial tiles combine image, metadata, long title, excerpt, and read link; ServicePage uses numbered features and proof imagery. | Repeated excerpt and CTA add weight to otherwise scan-friendly mobile lists. | Editorial card: title, one topic/metadata item, one action; omit excerpt on mobile when it repeats the article lead. Service steps become short numbered rows; avoid enclosing each in a large card if a list reads faster. |
| P2 | Motion and visual crop | Home hero and branding compare have scroll/touch/motion behavior; Shop category carousel auto-plays unless reduced motion is enabled. | Motion may compete with reading or interfere with touch navigation; image crop may hide product focal point at narrow ratios. | Keep essential labels static; use touch controls and pause. Validate focal point for the existing mobile artwork and preserve reduced-motion behavior. |

## Route and section inventory

The mobile treatment below applies to every listed section. Repeated component templates are counted once for design, then verified on every route using them.

| Route | Sections / states to cover | Mobile UX / visual treatment |
|---|---|---|
| `/` | Main hero; tire directions; branding before/after comparison; Shop campaign; expertise banner; footer | Hero: keep the title and one primary action over a useful crop. Directions: compact image cards with title and essential label only. Comparison: large touch handle and non-hover labels. Campaign/expertise: one message and one action each; avoid competing badges. |
| `/models` | Direction card list; empty catalog/contact state | Direction card: title and compact count/status; omit descriptive paragraph from mobile card. Empty state: clear explanation and one primary contact action. |
| `/models/[tireTypeSlug]` | Breadcrumbs/title; filters; result header; tire model cards; zero-model/no-match states | Put results near the title; filters collapse behind a compact control when confirmed necessary. Cards show model, application, and one fitment/size cue, not full description and multiple badges. |
| `/models/[tireTypeSlug]/[...segments]` category | Deeper breadcrumbs; category title; locked application; same filter/results/cards/states | Show a shortened breadcrumb trail with current category visible. Make locked application apparent in the summary; don't offer a nonfunctional selector. Reuse direction-card budget. |
| `/models/[tireTypeSlug]/[...segments]` model | Breadcrumbs/title; gallery; facts; order panel; advantages carousel; variants; documents; CTA | Preserve decision-to-order order. Full-screen swipe not required; use image gallery with visible controls. Short facts then selection/action. Technical values stay accessible through compact visible facts plus expansion. |
| `/shop` | Hero; wheel model cards; three order steps; category showcase; five vehicle images; footer | Keep one visual story per viewport: hero, wheel choice, steps, category, stories. Cards use title + one fact + action; steps as numbered list. Avoid displaying several story images simultaneously on narrow phone. |
| `/shop/categories` | Category hero carousel; category-card catalog | One slide at a time, title/action and visible controls. Catalog cards have image, title, and concise category cue. Make swipe optional, not the only navigation. |
| `/shop/[categorySlug]` product catalog | Breadcrumbs/title; subcategory filter; products; empty result; back link | One-column compact cards or narrow-screen row cards; no full description in listing. Keep filter and reset near results. |
| `/shop/[categorySlug]` lifestyle | Hero/breadcrumbs; approach principles; collection/empty state; next-category feature | Hero: one claim and one anchor action. Principles become short numbered rows or disclosures. Collection cards follow the mobile content budget. Next-category acts as a single end-of-page navigation tile. |
| `/shop/wheels/[wheelTypeSlug]` | Title; wheel filters (up to eight); result count; wheel cards; empty result | Filter trigger and selected count; group detailed parameters in one sheet. Cards show model, one defining style/series fact, and open action. |
| `/shop/wheels/[wheelTypeSlug]/[modelSlug]` | Breadcrumbs; gallery; facts; order panel; variant table; documents | Gallery → title/facts → parameter selection and primary request action → full specifications/documents. Compact supporting information; no oversized fixed desktop columns. |
| `/shop/product/[productSlug]` | Breadcrumbs; gallery/thumbnails; title/description; price; color/size/configuration; availability; CTA; long story | Gallery is swipe/click and thumbnail-selectable. Keep price, current option, availability and CTA together. Variant controls wrap with 44px targets. Long story follows configuration, not before it. |
| `/contact` | Contextual hero; standard/procurement form; validation/loading/error/success | Group fields by contact and request context, one column on phone. Keep labels visible and errors adjacent. Success summary is compact and next step obvious. No sticky submit while keyboard obscures fields unless proven useful. |
| `/about` | Service hero; optional notice; operating principles; proof image; CTA | Hero then short numbered principles; proof image/copy stack; one CTA. Use no card-specific filler. |
| `/branding` | Service hero; project stages; proof; contextual CTA | Same service template; stages become short steps. Keep the branding CTA visible after the explanation. |
| `/warranty` | Service hero; demo notice; three intake steps; proof; CTA | Notice visible without monopolizing the first screen; concise step titles, detailed instruction remains below/in disclosure; direct contact action. |
| `/become-a-supplier` | Service hero; contact steps; proof; CTA | Short numbered steps; single proof image; one clear application action. |
| `/privacy-policy` | Hero; legal notice; summary; full legal article | Readable text column, stable headings, wrapped long addresses/emails, no legal text hidden merely to shorten page. |
| `/shop/delivery-and-returns` | Heading/breadcrumbs; notice; order, delivery, return cards | Stack as compact policy sections with clear headings; preserve complete conditions and links. |
| `/tire-iq` | Hero; job navigation; application guide; axle/truck/bus selectors; topic chips; featured and regular knowledge cards; empty state | Choose a progressive sequence: job → application/vehicle → result/advice. Topic links wrap or use a clearly labeled control. Article cards omit excerpts on mobile when title/topic suffice. Keep selector results and next action visible. |
| `/tire-iq/[slug]` | Article hero; image/meta/aside; contextual visuals; rich-text article; related models; next step; back link | Narrow reading column, one lead image, restrained metadata. Related links are short title buttons. Actions stack, with one primary CTA. Rich text follows mobile table/media rules. |
| `/cart`, `/shop/cart` | Loading; empty; mixed populated groups; quantity/remove; request form; success/error | Retain all item/variant details needed to submit the right request. Present each line item as a compact row, not a marketing card; quantity and remove controls remain separate and touchable. Keep totals and primary submit action in a clear group. |
| `not-found`, unavailable content | Error/empty explanation; recovery/contact action | One short reason and one recovery action. Distinguish temporary catalog failure from a genuinely empty catalog. |

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

## UX recommendations that need visual design review

1. **Filter sheet versus inline accordion:** default proposal is a compact trigger plus one grouped sheet for both tire and wheel filters; compare with accordion if the 390px visual shows the sheet adds unnecessary friction.
2. **Catalog card form:** compare compact one-column horizontal cards against simple image-led vertical cards; decide by information priority and scan speed, not just number of products visible.
3. **Tire IQ flow:** compare existing stacked selectors with a guided progressive sequence; retain deep links and access to prior answers.
4. **Tables:** mobile spec cards remain the default under 768px, but render a concise first layer and a deliberate disclosure for secondary fields.
5. **Editorial/service content:** use short list rows and selective disclosure where it reduces card repetition, without deleting full page copy.

## Implementation priority proposal

- **First:** shared mobile shell/menu, card content hierarchy, tire/wheel filter experience, product detail action order, technical data usability, request/cart completion.
- **Second:** homepage and Shop section rhythm, image crop and category/story treatment, Tire IQ selectors and article cards.
- **Third:** service page typography, footer grouping, secondary decorative transitions.

All items remain mobile-only below 1024px. Verify 1024px and 1440px against locked references; do not redesign desktop.
