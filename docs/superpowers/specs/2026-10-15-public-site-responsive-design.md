# Public Site Responsive Adaptation Design

## Purpose and boundaries

Create a complete, evidence-based responsive adaptation of the public BIZON website. The outcome must preserve each page's content and primary task on narrow phones, tablets, and desktop, while replacing mobile interactions that depend on hover, cramped desktop controls, or inaccessible horizontal layouts.

Scope is the public route group `src/app/(site)`. The `frontend-cms` application is excluded. `/selection` is a redirect to `/models`, so it is a route alias rather than a separate page. This document defines the intended work and does not claim that every listed issue has already been confirmed in a browser.

## Approaches considered

1. **Route-by-route CSS patches.** Fast for isolated defects, but duplicates solutions across routes and leaves shared components inconsistent.
2. **Shared responsive patterns, implemented by page family. (Recommended.)** Audit every route and section, fix shared shell/content/catalog patterns first, then handle family-specific interaction and content exceptions. This gives complete route coverage with less regression risk.
3. **Mobile-first redesign of every page.** Offers the most freedom, but expands the scope beyond responsive adaptation and risks changing approved content and desktop behavior unnecessarily.

The chosen approach is 2. Keep established desktop composition where it works; introduce a new mobile interaction only when the audit demonstrates that simple reflow cannot preserve usability.

## Route and section coverage

### Main site and tire catalog

- `/`: hero; tire direction showcase; branding comparison; Shop campaign; expertise banner. Check mobile image crops and text contrast, touch target for comparison, carousel behavior, hero height, and reduced-motion behavior.
- `/models`: direction cards and empty catalog state. Reflow cards; retain count, description, and full-card link affordance.
- `/models/[tireTypeSlug]`: page heading/breadcrumbs, tire filters, result count, model cards, empty/no-match states.
- `/models/[tireTypeSlug]/[...segments]` category variant: same catalog pattern with category heading, locked application filter, deeper breadcrumbs, reset and empty states.
- `/models/[tireTypeSlug]/[...segments]` model variant: heading, product gallery, description/facts/advantages, size/order panel, variant table, documents, final CTA. Keep image, size selection, and contact action easy to reach; render variants as mobile cards or a clearly signposted scrollable table.

### Shop

- `/shop`: hero; forged-wheel introduction and model cards; order steps; category showcase; vehicle stories. Reflow text and cards; make category carousel touch- and keyboard-usable.
- `/shop/categories`: hero carousel and category cards. Ensure controls and continuation are discoverable and cards retain readable text.
- `/shop/[categorySlug]`, product-catalog variant: heading/breadcrumbs, subcategory filter, product grid, empty state and back link.
- `/shop/[categorySlug]`, lifestyle variant: image-led hero and breadcrumbs, principles, collection grid/empty state, optional next-category feature. Support mobile-specific imagery and stack content in task order.
- `/shop/wheels/[wheelTypeSlug]`: heading, up to eight wheel filters, result count, model grid and empty result. Evaluate a compact filter panel with apply/reset and selected-filter summary; validate URL state.
- `/shop/wheels/[wheelTypeSlug]/[modelSlug]`: breadcrumbs, gallery, model facts, order panel, variants table, documents.
- `/shop/product/[productSlug]`: breadcrumbs, gallery/thumbnails, price, variant selectors, availability, add-to-cart action, long description. Remove hover dependency and preserve selection/error feedback.
- `/shop/cart` and `/cart`: shared cart template in loading, empty, populated and request-submission states; grouped tires/wheels/Shop items, quantity/removal controls and contact fields.
- `/shop/delivery-and-returns`: heading/breadcrumbs, notice and three information cards.

### Service, contact, and editorial pages

- `/contact`: contextual hero; standard or procurement form; loading/error/success states. Check field order, mobile keyboard, inline errors, and confirmation summary.
- `/about`: hero; notice if present; operating principles; proof image; CTA.
- `/branding`: hero; project steps; proof image; contextual CTA.
- `/warranty`: hero; notice; three intake steps; proof image; contextual CTA.
- `/become-a-supplier`: hero; initial-contact steps; proof image; contextual CTA.
- `/privacy-policy`: service hero; notice; summary; full legal article including long addresses/emails.
- `/tire-iq`: hero; job/application/axle/truck/bus selectors; topic navigation; knowledge listing, featured card and empty state.
- `/tire-iq/[slug]`: article hero; image/meta/aside; rich-text body and contextual visuals; related model links; next-step actions; back link.
- Not-found and published-content-unavailable states: readable message, correct recovery action and non-overflowing CTA.

## Shared responsive architecture

- Treat `SiteShell`, both `ShopChrome` and `MainChrome` presentation modes, `PageHero`, service/article layouts, and `LexicalContent` styles as shared contracts. Fix shared behavior once and verify every consuming route.
- Keep CSS mobile-first. Grid containers in responsive layouts define explicit columns; nested grid/flex children that must shrink use `min-width: 0`; percentage-width elements that must not overflow pair `width: 100%` with `max-width: 100%`.
- Set constraints at each nesting level. Use `overflow-x` only when horizontal scrolling is the intended interaction, and ensure the user can discover and operate it.
- Use a consistent variant-table strategy for tire and wheel specifications. Prefer stacked records on narrow screens unless comparison requires a table; if scrolling is retained, preserve readable labels and indicate scroll affordance.
- Use touch-capable gallery/carousel controls with keyboard support. Respect `prefers-reduced-motion`; hover may enhance but cannot carry essential information.
- Keep CMS rich text safe at narrow widths: wrap long strings, constrain media, and define a readable strategy for wide tables.
- Consider a mobile sticky action only if the audit proves an important action becomes unreachable; account for browser safe areas and the on-screen keyboard.

## Mobile UX and visual direction

- Design for the user's next decision on each page, not for preserving the desktop arrangement. Keep the primary action and the minimum information needed to choose visible; move secondary detail to the destination/detail page or an intentional disclosure.
- Mobile cards must not try to contain all desktop copy. Reduce the number of visible text and decorative elements. Establish an explicit content budget for each card family during visual design: identity/title, one or two decision-critical facts, and a clear action/affordance. Remove or defer secondary description, repeated labels, badges and decorative metadata when they compete with that budget. Do not hide information essential to safe product selection; show that information in the detail view or selection flow.
- Produce an annotated mobile/desktop visual for each page family before implementation. Show section order, content density, image crop/focal point, card composition, action placement, and interaction states. These are reviewable layout decisions, not a full visual rebrand.
- Preserve approved content meaning and product claims. Prefer omission of nonessential card copy over inventing shorter claims; editorial shortening requires content-owner approval.

## Breakpoint and state matrix

Walk every page and section at 390 and 1440 CSS px. Add 320/360 checks for narrow cards, dense controls, long text and forms; use 430/768/1024 to validate layout transitions and tablet/desktop composition. These are checkpoints, not a mandate to add a media query at every width. Check short and long content, empty/no-match, loading/error/success, filter-selected, unavailable variant, and long-form CMS cases where applicable. Include actual mobile browser/device validation for viewport behavior after source-level and browser-emulation checks.

## Priorities

- **P0:** clipped/unreachable content or primary actions; mobile navigation; product configuration/cart/request flow; unusable filters or specification data.
- **P1:** shared page-family consistency; rich-text/table overflow; galleries and Tire IQ selectors; empty/error states and accessible controls.
- **P2:** image crop, decorative motion, spacing polish and secondary transitions.

## Acceptance evidence

For every route and relevant state, record viewport, screenshot or reproducible observation, source/component owner, severity, and result after implementation. Verify `window.innerWidth` against `document.documentElement.clientWidth`, inspect computed grid tracks and element widths, and identify any intentional local scrolling separately from accidental page overflow. Verify touch, keyboard, reduced motion, form feedback, and filter/variant URL history. Re-run the route matrix after shared component changes. Distinguish source review, browser emulation, real-device behavior, and API/CMS-dependent states in the report.

## Implementation decomposition

1. Baseline route inventory and responsive evidence.
2. User-task priorities and annotated responsive visuals for every unique section, including the mobile card content budget.
3. Shared shell, hero, container, and rich-text contracts.
4. Tire catalog and tire model details.
5. Shop landing, categories, wheels and product details.
6. Contact, forms, cart and request submission.
7. Service/legal content, Tire IQ listing and articles.
8. Full route/state regression and evidence report.

Each workstream is independently reviewable. The baseline and annotated visual proposals are reviewed before product-code changes. Before implementation, the plan must name exact files and verification actions; no product code is changed by this design artifact.
