# Public Site Mobile Visual Proposal

**Status:** Mobile UX decisions reviewed and confirmed. Implementation is in progress in the working tree; the new 350px route-by-route visual audit is at `mobile-350-2026-10-15/README.md`.
**Locked reference:** Existing composition above 767px, including tablet 768–1023px and desktop 1024px+. No tablet or desktop restyling is proposed.
**Source baseline:** `2026-10-15-public-site-responsive-baseline.md`

These are low-fidelity mobile layouts and content decisions, not final branded artwork. They define information order, density, crop, and interaction so page implementation can be reviewed against a stable UX direction.

## Design principles for mobile

1. One clear task per viewport. Keep one primary action visually dominant; make secondary navigation smaller and quieter.
2. Cards are summaries, not miniature pages. Show identity, at most two decision-critical facts, and an obvious open/action affordance. Omit secondary descriptions, repeated labels, redundant badges, and decorative tags. Keep all necessary technical/compatibility details reachable on the detail page.
3. Prefer vertical reading for page content. Use horizontal motion only for genuine carousels/galleries, with the agreed mobile affordances for each pattern; never require arrows where swipe is the chosen interaction.
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
- Show the user-approved bottom navigation on phone widths: four high-frequency destinations, with Main and Shop labels adapted to their separate tasks. Use safe-area padding and reserve page space beneath the content. The primary page CTA remains inline rather than fixed.
- On mobile, collapse navigation groups only (“Компания/Сервисы”, “Каталог/Помощь”). Keep brand, primary link, contact information and legal links directly visible.
- On mobile, breadcrumbs show only the nearest parent link and current page. Intermediate levels remain on desktop/tablet.

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
│ TIRE MODELS              │
│ [image · model · key fact│ │  swipe; no arrows/buttons
│  · open affordance]      │ │  next card edge is visible
│ [next card edge …]       │ │
└──────────────────────────┘
```

- **Hero:** keep product focal point visible; preserve current title/CTA meaning. If copy crowds the 320px view, omit nonessential supporting text rather than shrinking the title.
- **Home tire-model carousel:** retain the carousel, manual swipe only, no arrow buttons or dots, and no autoplay. Show the next card edge as the swipe hint. Cards contain only image, model identity, one decision-critical fact, and an open affordance.
- **Mobile hero CTA:** add “Перейти в каталог” to the mobile hero only; ensure crop and contrast support the action. Desktop stays as-is.
- **Branding comparison:** separate copy from the interaction. Keep the image comparison in a bounded frame with a touch-sized slider and “до/после” captions; place headline, explanation and CTA below the frame.
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

- **Filters:** open a bottom sheet with grouped controls and draft selections. Trigger shows selected count. Sticky bottom actions are “Сбросить” and “Показать N моделей”; apply commits query state and closes the sheet. Reset clears applied and draft values. The result count and zero-result feedback remain clear.
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
- **Category showcase:** one full-bleed slide at a time, manual swipe plus named progress dots; no mobile arrows or autoplay.
- **Vehicle stories:** swipe-only, one large image at a time, visible edge of next story, caption with vehicle/model. No arrows, dots, or autoplay; all stories remain reachable.

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

- Use compact horizontal product rows consistently: image left; product name, price, and existing action on the right. Keep variant products on their existing detail/variant path and simple products on add-to-cart. Omit long excerpts and secondary decoration.
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
- Tire/wheel and Shop product main images support direct swipe; thumbnails stay available as secondary navigation, indicate the active image, and scroll the selected thumb into view. The primary purchase/request action remains inline after options and availability.
- Collapse a long Shop product story under “Подробнее о товаре”; keep short summary and price near the title.
- Contact forms use visible labels, logical fieldsets, 44px+ inputs, nearby errors, and stable focus when the keyboard appears. Preserve current request data and form behavior.
- Procurement form keeps required name/contact/request fields visible. Optional axle, region, timing, company and comment fields open under “Добавить детали к заявке”; say clearly that one contact method is enough.
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
- Editorial cards are uniform, with image, date/topic, title and a small open affordance; omit excerpt and a redundant “Читать” action.
- On article detail, “Передать задачу специалисту” is the primary full-width action; “Посмотреть каталог” is a quieter text link. Simple parameter/value tables become stacked pairs; wide comparison tables scroll inside a bounded region with the first label column sticky and a visible scroll cue.
- Tire IQ starts with task navigation. On mobile, application, axle and vehicle selectors are collapsed until requested; show the relevant diagram within the expanded selector and keep prior answers editable.
- Privacy, delivery, return and warranty pages retain all text and conditions; reduce card chrome/padding and separate sections without collapsing legal detail.

## Confirmed mobile interaction and content decisions

- Main page model selection remains a swipe carousel, with a partial next-card peek and no arrows, dots, or autoplay.
- Tire and wheel filters use the same bottom-sheet behavior: draft values, selected count, sticky reset/apply actions, count in the apply label, then close on apply.
- Shop product catalog uses compact horizontal rows and keeps current variant/add-to-cart behavior.
- Product and service details prioritize the next decision/action; long nonessential copy and secondary specifications use explicit disclosures. Legal and transactional terms remain fully visible.
- Shop category showcase uses swipe plus named dots; vehicle stories use swipe and a partial next-card peek, with no controls beyond the cards.
- Product galleries support direct swipe; thumbnails remain secondary navigation.
- Mobile changes are restricted to <=767px. Tablet and desktop compositions are locked.

These decisions complete the visual review checkpoint. Product-code implementation remains a separate next stage in the plan.
