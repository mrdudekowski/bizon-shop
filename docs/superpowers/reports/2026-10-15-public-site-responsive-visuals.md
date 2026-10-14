# Public Site Mobile Visual Proposal

**Status:** Review draft; mobile-only.  
**Locked reference:** Existing composition at 1024px and above. No desktop restyling is proposed.  
**Source baseline:** `2026-10-15-public-site-responsive-baseline.md`

These are low-fidelity mobile layouts and content decisions, not final branded artwork. They define information order, density, crop, and interaction so page implementation can be reviewed against a stable UX direction.

## Design principles for mobile

1. One clear task per viewport. Keep one primary action visually dominant; make secondary navigation smaller and quieter.
2. Cards are summaries, not miniature pages. Show identity, at most two decision-critical facts, and an obvious open/action affordance. Omit secondary descriptions, repeated labels, redundant badges, and decorative tags. Keep all necessary technical/compatibility details reachable on the detail page.
3. Prefer vertical reading for page content. Use horizontal motion only for a genuine gallery/carousel and give it visible controls, a pause affordance where autoplay exists, and a non-gesture path.
4. Image-led sections use a deliberate mobile focal point and a readable overlay/solid copy area. Never put essential copy over a visually busy crop without checking contrast.
5. Use progressive disclosure for secondary specifications and long instructions; keep the primary choice and its consequence visible.
6. Existing colors, type system, radii, assets, and desktop compositions remain as they are. This work changes mobile hierarchy and arrangement only.

## Common mobile shell

```text
┌──────────────────────────┐
│ ☰   BIZON        [cart]  │  compact header; one row
├──────────────────────────┤
│                          │
│        PAGE CONTENT      │  scrolls naturally
│                          │
├──────────────────────────┤
│ footer groups / legal    │  no sticky footer by default
└──────────────────────────┘
```

- Main and Shop retain their own navigation labels, but use the same mobile drawer behavior, close control, focus return and safe-area rules.
- Do not add bottom navigation. Do not keep a primary CTA fixed by default; consider a fixed action only if Task 1 proves the action otherwise becomes unreachable.
- Footer groups may collapse after the audit confirms the current link volume makes the mobile footer difficult to scan. Contact and legal access stay directly discoverable.

## Section wireframes

### Main page

```text
┌──────────────────────────┐
│ image crop: tire/tread   │
│ EYEBROW                  │
│ Short headline           │
│ one supporting sentence │
│ [Primary action]         │
└──────────────────────────┘
┌──────────────────────────┐
│ DIRECTIONS               │
│ ┌──────────────────────┐ │
│ │ image                │ │
│ │ TBR       3 models   │ │  no paragraph on the card
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ image                │ │
│ │ OTR       1 model    │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

- **Hero:** keep product focal point visible; preserve current title/CTA meaning. If copy crowds the 320px view, omit nonessential supporting text rather than shrinking the title.
- **Tire direction section:** one card per row on small phones. Title and compact model count/status; no paragraph because the destination page already provides the description.
- **Branding comparison:** image comparison fills a bounded mobile frame. Handle gets a touch-sized hit area; “before/after” captions sit in a stable bottom strip rather than competing with the headline. CTA sits after the image, not inside the draggable surface.
- **Shop and expertise campaigns:** image crop, short message, one action; put decorative kicker/duplicated brand tags behind hierarchy.

### Tire catalog and model cards

```text
┌──────────────────────────┐
│ Breadcrumbs: … / TBR     │
│ TBR — грузовые шины      │
│ [Фильтры · 2]            │
│ 3 модели                 │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ [image] BIZON DSR158 │ │
│ │ Long Haul · Ведущая  │ │
│ │ 12.00R20              │ │
│ │ Открыть →             │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

- **Filters:** trigger summarizes selected count. Sheet groups application, axle, size; bottom actions reset/apply. Result count remains in the list header. If a 390px prototype shows an inline accordion is faster, use that instead of a sheet.
- **Tire cards:** image, model name, one application label, one useful size cue, open action. Omit complete paragraph, duplicate axle chips and benefit badges. Full model description, all sizes and benefits remain on detail.
- **No result/empty:** show one short reason, a reset action and one specialist-contact action. Avoid equal visual weight for two CTAs.

### Tire model detail and technical data

```text
┌──────────────────────────┐
│ Breadcrumbs              │
│ BIZON DSR158             │
│ short lead               │
│ ┌──────────────────────┐ │
│ │ product image        │ │  swipe + visible thumbnails
│ └──────────────────────┘ │
│ BIZON TBR                │
│ essential facts (3 rows) │
│ Type size [select]       │
│ Qty [-] 1 [+]            │
│ [Add to request]         │
├──────────────────────────┤
│ Benefits (secondary)    │
│ Specifications           │
│ 12.00R20                 │
│ Load index 153  …        │  first decision-critical values
│ [All specifications ▾]  │  remaining data remains reachable
│ Documents                │
│ [Consult specialist]     │
└──────────────────────────┘
```

- Put selection and request action before editorial benefits and documents. Keep fitment-critical facts visible before the action.
- **Spec cards:** initial view shows size and the fields needed for selection; “Все характеристики” expands the remaining rows. Do not remove data or make users sideways-scroll a 14-column table on a phone.
- **Wheel detail** follows the same sequence with rim configuration facts and order controls.

### Shop home and category discovery

```text
┌──────────────────────────┐
│ full-bleed image crop    │
│ title + one short lead   │
│ [Choose wheels]          │
├──────────────────────────┤
│ CHOOSE DESIGN            │
│ [wheel image]            │
│ Atlas · Off-road         │  one key fact
│ Open model →             │
│ [next model …]            │
├──────────────────────────┤
│ HOW TO ORDER             │
│ 01 Choose design         │
│ 02 Share vehicle         │  numbered rows, minimal repeated copy
│ 03 Confirm fit           │
├──────────────────────────┤
│ CATEGORY carousel (1)    │
│ [● ○ ○ ○ ○] [controls]  │
├──────────────────────────┤
│ VEHICLE STORIES (1/5)    │
│ [image]                  │  one image at a time
│ model · wheel            │
│ [previous]     [next]    │
└──────────────────────────┘
```

- **Wheel model cards:** image/title/one style or series fact/open affordance. Keep “made to order” only if it changes a user's decision.
- **Order steps:** keep numbers and task titles, move the three paragraphs out of large repeated cards. Use one-line helper only if the title alone is ambiguous.
- **Category carousel:** one main slide, title and controls; stop on user interaction and respect reduced motion.
- **Vehicle stories:** show one story at a time with title and wheel/model label. Keep all five available; don't stack five full-width images into a long image wall.

### Shop category lists and product cards

```text
┌──────────────────────────┐
│ Shop / Category          │
│ Category title           │
│ [Subcategory ▾]          │
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ image     Product    │ │
│ │           price      │ │
│ │           [Details]  │ │  one row; no long excerpt
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ image     Product    │ │
│ │           price      │ │
│ │           [Details]  │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

- Test horizontal compact rows against one-column vertical cards at 320, 360 and 390px. Choose one consistent pattern that leaves product image, name and price readable.
- Remove card excerpt on mobile unless the text carries a real differentiating fact. Do not shrink type to retain the whole card.
- **Lifestyle landing:** full-bleed hero → compact numbered principles → collection → one next-category tile. Principles use title plus optional disclosure for detail instead of several large paragraph cards.
- **Empty collection:** explain that the collection is pending and show one contact action; avoid an empty grid frame.

### Wheel filter and catalog

```text
┌──────────────────────────┐
│ Кованые диски            │
│ [Параметры · 3]          │
│ 12 моделей               │
│ Active: 18″ × 9 · +2     │
├──────────────────────────┤
│ [wheel card]             │
│ Atlas · Off-road         │
│ [Open]                  │
└──────────────────────────┘
          tap filter
┌──────────────────────────┐
│ Параметры диска     [×]  │
│ Style / Diameter         │
│ Width / PCD              │
│ ET / DIA / color         │
│ Price                    │
│ [Reset] [Show results]   │
└──────────────────────────┘
```

Group related parameters; don't show eight full-width selects above the results. Keep active choices visible so users know why results changed. At narrow width, card carries only model/style and action; fitment detail belongs on wheel detail.

### Product detail, forms and cart

```text
Product:   image → title → price → options → availability → [Add]
Request:   contact → vehicle/request context → comment → [Send]
Cart row:  product + selected variant | quantity | remove
           summary / terms             | [Submit request]
```

- Product detail keeps selected variant, price and action together. Long story follows options.
- Contact forms use visible labels, logical fieldsets, 44px+ inputs, nearby errors, and stable focus when the keyboard appears. Preserve current request data and form behavior.
- Cart is a compact order list, not promotional tiles. Retain all SKU/variant information necessary for a correct order; don't bury remove/quantity controls or the submit action.
- Avoid a fixed CTA while the keyboard is open. If a fixed action proves necessary, it must yield to the keyboard and safe-area inset.

### Service, legal, editorial, and Tire IQ

```text
SERVICE: hero → short numbered list → proof image/copy → one action
ARTICLE: title → one lead image/meta → readable article → related models → one next action
TIRE IQ: job → application → axle/vehicle → result → related reading
POLICY: title → summary headings → full readable legal text
```

- Service features become short numbered rows rather than large bordered cards with repeated descriptions. Full instructions remain available below or behind a deliberate disclosure.
- Editorial cards show title, one topic/date, and open action; omit repeated excerpt on mobile. Article body maintains comfortable line length and supports wide data through explicit disclosure/scroll.
- Tire IQ selectors use one clear question at a time only if the current stacked controls are confirmed to overwhelm the user; keep answers editable and maintain context when moving backward.
- Privacy and delivery pages retain all content; reduce visual chrome, not legal detail.

## Decisions requested before implementation

1. Approve or adjust the mobile card budget: title, up to two decision-critical facts, clear affordance; remove secondary copy and decoration from mobile card faces.
2. Approve the proposed information order for tire/wheel details and technical data disclosure.
3. Review whether filters should be a sheet (default proposal) or compact accordion.
4. Review whether Shop product cards should be one-column compact rows at all mobile widths or vertical image cards with concise content.

Once these mobile visuals are approved, implementation can start at Task 3 of the plan. Desktop remains locked at 1024px and above.
