# BIZON public visual audit — 2026-11-02

## Scope and evidence boundary

Task 1 baseline for the approved `2026-11-02-public-site-visual-unification-design.md` and `2026-11-02-bizon-visual-unification.md`. This is an audit, not a claim that the site has been fixed or is ready for release.

- Checkout: `C:\Users\HP\Documents\Cursor projects\Commersial\Bizon-main-app`, branch `main-app`, starting HEAD `21ddf60d48eebac1978143a6b96a74e8616a3a70`.
- Preview inspected: `https://mrdudekowski-bizon-shop-931a.twc1.net/`. All route paths below are relative to that origin.
- Data classification **P**: content rendered by that published preview. It includes obvious preview content (example contacts, placeholder legal information, “шуры муры”, and “Мега прицеп”). P does not establish production correctness, DB provenance, or a match to checkout HEAD. No fixture was used as live evidence.
- Browser: Codex in-app browser, viewport override and read-only DOM/computed-style evaluation through the supported browser controls. This is browser emulation, not a physical phone/tablet or a cross-browser test.
- Route capture: rendered headings, main text, discovered links, carousel controls, URL and document dimensions at 390 px. These are textual DOM captures. Screenshot samples were additionally viewed for the family representatives listed below; there is no permanent screenshot bundle in this report-only change.
- Only page navigation, local filter/menu changes, keyboard navigation, gallery pointer drags and scrolling were performed. No form was submitted, personal data entered, cart item added, CMS state changed, or deployment made.
- Pre-existing dirty files were recorded before work and left untouched. In particular, current service/footer/navigation/form source differs from the deployed preview. The deployment revision was not established.

### Evidence IDs

| ID | Evidence captured in this audit |
| --- | --- |
| E1 | 390 px route DOM captures: requested/resolved path, headings, main text, internal links, carousel controls and document geometry. Route ledger below records each result. |
| E2 | 21 family representatives × 8 widths: `innerWidth`, `documentElement.clientWidth`, `scrollWidth`, media-query state, first four computed grid containers and intended overflow containers. |
| E3 | Viewed 390 px screenshots: home hero/assortment, about, contact, privacy, geography, model index/list/no-match/OTR/detail, Shop hero/model strip/categories/empty category/product category/wheel index/wheel detail/product detail, both empty carts, combined service page, IQ list/topic result/article. Some first-paint captures show image placeholders; these were not diagnosed as broken assets. |
| E4 | Home hero screenshots at 320/360/390/430/768/1023/1024/1440 px. Existing tablet/desktop composition is the reference, not a redesign proposal. |
| E5 | 1440 px carousel next/previous clicks, recording active progress control after each click: Shop 10+10; Shop categories 10+10; DSR158 6+6; DSR188 6+6. |
| E6 | 390 px native horizontal scroll: assortment and Shop model strips, 12 attempts in each direction, recording scrollLeft/clientWidth/scrollWidth and observing endpoints. |
| E7 | 390 px Atlas gallery: eight pointer drags each direction; active thumbnail recorded after every drag. Main-image click and cursor checked separately. |
| E8 | 390 px keyboard/menu/header/filter scenarios described in the finding register. |
| E9 | Read-only source review: route files, sitemap, shared chrome/menu/focus trap, forms/cart storage, carousel/gallery components and filter controller. This does not prove deployed behavior. |

## Complete route and variant ledger

All rows were visited at requested **390 px**. Unless stated otherwise: P data; default valid-content state; Tires chrome outside Shop and Shop chrome inside Shop; `innerWidth/clientWidth/scrollWidth = 390/380/380`. The 10 px difference is the browser scrollbar allocation, not document overflow. “Unavailable” describes the intended template, even when the host renders some other page.

### Static routes and service contexts

| Route | Rendered template/state and concrete observation | Availability / coverage |
| --- | --- | --- |
| `/` | Home hero, three assortment models, branding comparison, single-frame Shop campaign, expertise CTA | P; E1/E3/E4; F01 |
| `/about/` | PageHero + ServicePage; “О компании BIZON”, proof section and CTA | P; E1/E3; F02 |
| `/contact/` | PageHero + contextual contact form; empty form, no submission | P; E1/E3; F03 |
| `/delivery/` | Home H1 “Шины для больших задач” while URL remains `/delivery/`; rechecked after visible H1 appeared | Intended service template unavailable on preview; observed fallback, not inferred from source |
| `/delivery-geography/` | PageHero + delivery copy + configured form, “География поставок” | P; E1/E3; F05; checkout content is different |
| `/payment/` | Home H1 and home assortment links while URL remains `/payment/` | Intended service template unavailable on preview; E1 |
| `/warranty/` | PageHero + ServicePage; “Гарантия и обращение”, feature list, CTA | P; E1; shared F02/F04 geometry coverage |
| `/become-a-supplier/` | PageHero/service partnership content; “Стать поставщиком”, “Работаем с профессиональным рынком” | P; E1; shared service/form families; no submission |
| `/branding/` | PageHero + image + three numbered benefits + CTA; “Индивидуальное брендирование шин для спецтехники” | P; E1; shared F02/F04; comparison control is on home, not this template |
| `/privacy-policy/` | Legal PageHero + numbered content and detailed policy; published placeholder operator information | P; E1/E3; F04; no legal/content edits authorized |
| `/selection/` | Brief empty shell during client redirect, then `/models/` | Redirect confirmed with URL wait; not classified as an empty-page defect |
| `/shop/` | Shop hero, three featured wheel models, ordering details, five-category carousel, five vehicle figures | P; E1/E3/E5/E6; F10 |
| `/shop/categories/` | “Продолжение движения”; category hero carousel plus category index | P; E1/E3/E5; F11 |
| `/shop/cart/` | “Заявка BIZON Shop”; empty cart; links to wheels and Shop | P empty state; E1/E3; F18; populated state unavailable under read-only scope |
| `/cart/` | “Заявка Bizon”; empty Tires cart; link to tire catalog | P empty state; E1/E3; F17; populated state unavailable under read-only scope |
| `/shop/delivery-and-returns/` | “Оплата, доставка и возврат”; four service sections; deployed `DeliveryAndReturnsContent` template | P; E1/E3; F19; source file is already removed by unrelated dirty work, so source cannot substitute for this deployment |
| `/shop/delivery/` | Home H1 and assortment links under original URL | Intended Shop service template unavailable on preview; observed E1 |
| `/shop/payment/` | Home H1 and assortment links under original URL | Intended Shop service template unavailable on preview; observed E1 |
| `/shop/warranty/` | Home H1 and assortment links under original URL | Intended Shop service template unavailable on preview; observed E1 |
| `/shop/become-a-supplier/` | Home H1 and assortment links under original URL | Intended Shop supplier template unavailable on preview; observed E1 |
| `/tire-iq/` | Editorial PageHero, job/axle/vehicle selectors, topic links and 13 articles | P; E1/E3; F20 |
| `/__visual-audit-not-found__/` | Home H1 while invalid URL remains unchanged | Deliberately invalid route; deployed not-found template unavailable because host falls back to home |

The spec's “29 routes/families” is a grouping, not an exact filesystem count: the checkout additionally contains the four individual Shop service paths above. They are explicitly included rather than silently dropped from the audit.

### Tire catalog dynamic variants

| Route | Rendered template/state | Availability / coverage |
| --- | --- | --- |
| `/models/` | Tire direction index: TBR 3 models; OTR 0 models | P; E1/E3; F06 |
| `/models/tbr/` | Direction list with 3 cards and mobile filter sheet | P; E1/E3/E8; F07 |
| `/models/otr/` | Direction empty state “Категория без моделей”, contact CTA | P; E1/E3; F08; published category exists, no OTR model variant available |
| `/models/tbr/long-haul/` | Category list, one DSR158 card | P; E1; list family F07 |
| `/models/tbr/off-road/` | Category list, one DSR177 card | P; E1; list family F07 |
| `/models/tbr/regional/` | Category list, one DSR188 card | P; E1; list family F07 |
| `/models/tbr/long-haul/dsr158/` | Tire detail, product gallery, three advantages, technical sizes | P; E1/E3/E5; F09 |
| `/models/tbr/off-road/dsr177/` | Tire detail, one advantage “Управляемость”, no multiple-slide controls | P; E1; F09; single-slide exception |
| `/models/tbr/regional/dsr188/` | Tire detail, three advantages, technical sizes | P; E1/E5; F09 |
| `/models/tbr/dsr158/` | Legacy model alias initially empty then canonical long-haul detail | Redirect URL explicitly confirmed; not a separate product template |
| `/models/tbr/dsr177/` | Legacy alias discovered in article links; initial empty redirect shell captured | Final redirect target not independently waited for; canonical off-road route separately inspected |
| `/models/tbr/dsr188/` | Legacy alias discovered in article links; initial empty redirect shell captured | Final redirect target not independently waited for; canonical regional route separately inspected |

### Shop dynamic variants

| Route | Rendered template/state | Availability / coverage |
| --- | --- | --- |
| `/shop/outdoor/` | CMS product catalog; empty “Коллекция готовится”; lead “шуры муры” | P; E1/E3; F12; preview content, not a visual fix request |
| `/shop/accessory/` | CMS product catalog; empty collection | P; E1; F12 |
| `/shop/accessories/` | CMS product catalog; empty collection | P; E1; F12 |
| `/shop/masla-i-zapchasti/` | CMS product catalog; empty collection | P; E1; F12 |
| `/shop/pritsepy/` | CMS product catalog; one “Мега прицеп” card, price on request | P; E1/E3; F13 |
| `/shop/wheels/forged/` | Forged catalog hero, filter controls, 4 models | P; E1/E3; F14; only published wheel type discovered |
| `/shop/wheels/forged/atlas/` | Wheel detail; 4-photo gallery; specification rows and request form | P; E1/E3/E7; F15 |
| `/shop/wheels/forged/bastion/` | Wheel detail; Dark Graphite; specification/request sections | P; E1; F15 |
| `/shop/wheels/forged/ember/` | Wheel detail; Red; specification/request sections | P; E1; F15 |
| `/shop/wheels/forged/nomad/` | Wheel detail; Bronze; specification/request sections | P; E1; F15 |
| `/shop/product/mega-pritsep/` | Product configurator; single placeholder image, price on request, in-stock label; category displayed as “Pritsepy” | P; E1/E3; F16; no second product/variant-rich example discovered |
| Lifestyle fallback branch of `/shop/[categorySlug]` | Source has `ShopLifestyleCategoryPage` when no CMS category exists | Unavailable in observed published categories: they render CMS catalog instead. No CMS data changed to force this branch |

No claim is made that visible link discovery enumerates unpublished content or every DB row. All dynamic variants exposed by the audited navigation/main-content link closure were accounted for. No guessed product slugs were used to manufacture coverage.

### Tire IQ article variants

Every following route was individually visited at 390 px and rendered an article title, PageHero, lead/visual/article content, related-model links and CTA (P; E1). F21 additionally supplies the complete width matrix and a viewed screenshot for `axle-role-in-tire-selection`.

- `/tire-iq/construction-route-tire-check/`
- `/tire-iq/fleet-pressure-log-method/`
- `/tire-iq/quarry-tbr-operating-conditions/`
- `/tire-iq/tbr-pre-trip-tire-inspection/`
- `/tire-iq/tire-damage-escalation/`
- `/tire-iq/dual-fitment-tire-check/`
- `/tire-iq/drive-axle-tire-selection/`
- `/tire-iq/how-to-read-tire-size-marking/`
- `/tire-iq/load-and-inflation-engineering-relationship/`
- `/tire-iq/tire-lifecycle-inspection-basics/`
- `/tire-iq/cold-inflation-pressure-check/`
- `/tire-iq/axle-role-in-tire-selection/`
- `/tire-iq/uneven-tread-wear-first-checks/`

Additional state `/tire-iq/?topic=axles#knowledge` was visited explicitly (E3/E8): “Оси” has `aria-current=page`, but all 13 article cards remain visible, including construction/pressure/quarry articles. The selected semantic state is present; the preliminary claim that active state is completely unsynchronized is too broad.

## Responsive family matrix and layout diagnostics

E2 inspected each row at **320, 360, 390, 430, 768, 1023, 1024 and 1440 px**, height 900. Screenshot/mobile interaction samples used 390×844. For all 168 family measurements, requested width equalled `innerWidth`; `clientWidth = innerWidth - 10`; `scrollWidth = clientWidth`. Thus there was no measured true document horizontal overflow in the sampled default/empty states. This does not certify every expanded interaction or arbitrary longer CMS content.

| Family | Representative | Template/body distinction | Width coverage |
| --- | --- | --- | --- |
| F01 | `/` | Home editorial hero/campaign/assortment | All 8; E2 + hero screenshots all 8 |
| F02 | `/about/` | Service PageHero, proof, CTA | All 8; E2; screenshot 390 |
| F03 | `/contact/` | Contextual form | All 8; E2; screenshot 390 |
| F04 | `/privacy-policy/` | Legal numbered/list content | All 8; E2; screenshot 390 |
| F05 | `/delivery-geography/` | Service prose + configured form | All 8; E2; screenshot 390 |
| F06 | `/models/` | Direction cards | All 8; E2; screenshot 390 |
| F07 | `/models/tbr/` | Tire/category list + filters | All 8; E2; screenshot/interaction 390 |
| F08 | `/models/otr/` | Empty direction | All 8; E2; screenshot 390 |
| F09 | `/models/tbr/long-haul/dsr158/` | Tire gallery/advantages/technical table | All 8; E2; screenshot 390; carousel 1440 |
| F10 | `/shop/` | Shop hero, model strip, categories, vehicle list | All 8; E2; screenshot 390; carousel 1440 |
| F11 | `/shop/categories/` | Category carousel hero/index | All 8; E2; screenshot 390; carousel 1440 |
| F12 | `/shop/outdoor/` | Empty product catalog | All 8; E2; screenshot 390 |
| F13 | `/shop/pritsepy/` | Populated product catalog | All 8; E2; screenshot 390 |
| F14 | `/shop/wheels/forged/` | Forged catalog/filter grid | All 8; E2; screenshot 390 |
| F15 | `/shop/wheels/forged/atlas/` | Wheel gallery/table/request | All 8; E2; screenshot/pointer cycle 390 |
| F16 | `/shop/product/mega-pritsep/` | Shop product configurator | All 8; E2; screenshot 390 |
| F17 | `/cart/` | Empty Tires cart | All 8; E2; screenshot 390 |
| F18 | `/shop/cart/` | Empty Shop cart | All 8; E2; screenshot 390 |
| F19 | `/shop/delivery-and-returns/` | Deployed combined service sections | All 8; E2; screenshot 390 |
| F20 | `/tire-iq/` | Editorial/selectors/topic listing | All 8; E2; topic screenshot 390 |
| F21 | `/tire-iq/axle-role-in-tire-selection/` | Article/related models/CTA | All 8; E2; screenshot 390 |

For each width the media-query diagnostic `(max-width:639px)` was true only at 320/360/390/430, and `(min-width:640px)` true at 768/1023/1024/1440. Widths 768 and above retain their current page composition as the approved reference. Mobile-only bottom navigation disappearing on tablet and desktop is intentional; large editorial hero headings, black Shop surfaces and white editorial/service surfaces are intentional context differences.

These are DOM/geometry inspections across all 8 widths, **not** a claim of eight screenshot reviews per family. Pixel-level visual comparison of every family at every width remains unverified; only the home hero has viewed screenshots across the full width set. No layout or token change is justified solely by a source-rule match.

### Representative computed constraints at 390 px

| Container | Computed tracks / item width / parent width | Interpretation |
| --- | --- | --- |
| Home hero | `380px`; 380 / 380; min-width 0; max-width 100% | Explicit resolved column within document |
| Home inner | `340px`; 380 / 380; padding accounts for inner track | No document overflow |
| PageHero copy | `340px`; 340 / 380; min-width 0, max-width 100% | Shared service/editorial shell fits |
| ServicePage body | `340px`; 380 / 380; min-width 0, max-width 100% | Nested shell fits |
| ConfiguredForm on geography | `298.667px`; 340 / 380; min-width 0, max-width 100% | Form fits measured state |
| Tire product stage | `340px`; 340 / 380; min-width 0 | Gallery/details stack fits |
| Product catalog card | `131.729px 214.938px`; 348 / 348 | Explicit two-column mobile product row fits |
| Shop product layout | `348px`; 348 / 380; min-width 0 | Product body fits |
| Article body | `340px`; 380 / 380; min-width 0, max-width 100% | Article shell fits |

Hidden filter fields can report `grid-template-columns:none` with width/parent width 0 while the sheet is closed. This is not a reproduced intrinsic sizing bug. Some visible source/layout samples retain `min-width:auto` or `max-width:none`, but fit their parents in E2; retain these as policy review candidates, not confirmed visual defects.

### Local horizontal scrolling, separately measured

| Surface at 390 | clientWidth / scrollWidth / min-width | Classification |
| --- | --- | --- |
| Home assortment | 340 / 2010 / 0px | Active card carousel; looping requirement applies |
| Shop featured models | 356 / 2118 / 0px | Active card carousel with cue/duplicate set; looping requirement applies |
| Shop vehicle figures | 364 / 1741 / 0px | Ordinary five-figure horizontal list; no cyclic claim/control observed; do not convert merely because scrollable |
| Atlas thumbnail rail | 340 / 382 / 0px | Ordinary thumbnail chooser; rail need not loop; main gallery switching assessed separately |

Technical variant tables, filter controls, branding before/after range and ordinary lists are not content carousels. No document overflow was attributed to their intended local scrolling.

## Carousel and gallery inventory

| Surface / owner | Published count and tested state | Result and limits |
| --- | --- | --- |
| Home assortment — `main/AssortmentCarousel.tsx`, `catalog/useLoopingTrack.ts` | 3 unique cards, 6 DOM cards; 390 px; native scroll E6, 12 attempts each direction | Reaches finite endpoints 0 and 1670 (`2010-340`) and remains there across additional attempts and screenshot observations. Two seamless cycles cannot be completed. See V04. Pointer/wheel emulation only; physical touch unverified |
| Shop featured wheel strip — `shop/ShopHomeClient.tsx`, `catalog/useLoopingTrack.ts` | 3 unique cards, duplicated; 390 px; E6, 12 attempts each direction | Reaches 0 and approximately 1762.67 (`2118-356`, fractional CSS geometry), then stops despite further scroll. Two complete loops cannot be completed. See V04 |
| Shop categories — `shop/ShopCategoryCarousel.tsx` | 5 slides at `/shop/`; 1440 px; E5 | Two forward cycles (10 clicks), two reverse cycles (10 clicks) return to camping. Every step updates active control in expected order. Hidden-link focus fails separately (V02). Continuous touch/crossfade-frame continuity/reduced motion not verified |
| Category-index hero — same owner | 5 slides at `/shop/categories/`; 1440 px; E5 | Same 10+10 complete cycles; background slides have no title links on this instance. Touch/intermediate-frame continuity unverified |
| DSR158 advantages — `catalog/ModelAdvantagesCarousel.tsx` | 3 slides; 1440 px; E5 | `Стойкость к разрывам → Высокая грузоподъёмность → Самоочищение → first`, repeated twice; reverse twice; pass for button order/wrap |
| DSR188 advantages — same owner | 3 slides; 1440 px; E5 | `Износостойкость → Высокая грузоподъёмность → Теплоотвод → first`, twice; reverse twice; pass for button order/wrap |
| DSR177 advantages — same owner | 1 slide “Управляемость” | Static one-slide instance; no active cycle to test |
| Atlas main gallery — `catalog/CatalogProductGallery.tsx` | 4 photos; 390 px; E7 | Pointer drag sequence `2,3,4,1,2,3,4,1`; reverse `4,3,2,1,4,3,2,1`. Two complete wraps each way. This is mouse/pointer drag, not actual touch. Finite thumbnail rail is intentional |
| Bastion/Ember/Nomad and tire main galleries — same owner | Detail templates individually available | Default state inspected; per-instance two-cycle/photo-count tests not repeated. Shared source is not proof of each published gallery configuration |
| Shop product gallery — `shop/ShopProductConfigurator.tsx` | Mega trailer has one placeholder image | Static instance; multiple-image and variant-rich states unavailable in discovered published product |
| Home Shop campaign — `main/ShopCampaign.tsx` | `#home-shop` contains one image, data-active=true, no buttons | Published instance is static; no active autoplay carousel to test. Multiple-frame 6-second implementation exists in source, but no deployed multi-frame pause/cycle finding reproduced |
| Legacy `ProductCarousel` / `ProductsSection` | Source components found, not found on audited active pages | No active public surface established; not added to the product surface for testing |

Button-wrap success does not certify absence of a visible jump during every animation frame. Hardware touch, vertical-vs-horizontal gesture discrimination, resize during gesture, reduced-motion override, autoplay timing/pause, small-count multi-slide fixtures and all gallery variants remain explicit verification gaps.

## Confirmed deployed finding register

Priorities: P1 blocks a central selection/navigation result; P2 causes interaction/accessibility confusion; P3 is a smaller presentation defect. “Owner” names the component area to inspect, not proof that checkout currently contains the same defect.

| ID / severity | Location, state, viewport | Reproduction / observed vs expected | Impact and evidence | Component owner |
| --- | --- | --- | --- | --- |
| V01 / P1 | `/models/tbr/`; mobile filter sheet; 390 | Open Фильтры → Применение=Construction → Показать 0 моделей. Count becomes 0 and no-match text appears, yet DSR158/177/188 cards remain visible. Expected card visibility to match result count | Contradictory selection result can lead to choosing an excluded model. E8 DOM main text plus viewed screenshot shows zero-count message and DSR158/177 cards together | `catalog/TireCatalogFilterController.tsx`, `TireModelCard.tsx`, `TireCatalog.module.css`; examine computed display vs hidden attribute in deployment |
| V02 / P2 | `/shop/`; category carousel; 390 | Focus visible slide link, press Tab. activeElement becomes “Аксессуары” inside `aria-hidden=true` article with computed opacity 0; all four inactive links have tabIndex 0. Expected hidden slides excluded from Tab | Invisible keyboard target. E8 activeElement, ancestor aria-hidden and computed opacity. `/shop/categories/` instance has no slide title links, so does not reproduce this exact issue | `shop/ShopCategoryCarousel.tsx` |
| V03 / P2 | `/shop/`; menu opened, Категории panel selected; 390 | Focus final new “Прицепы” link, press Tab. activeElement becomes BODY, outside dialog. Expected wrap to a current eligible dialog target | Keyboard focus escapes changing menu. E8 DOM snapshot of added links and subsequent activeElement/inside=false. Closed via dialog close control; focus returned to opener | `hooks/useFocusTrap.js`, `DualPaneMenu/DualPaneMenu.tsx` |
| V04 / P2 | `/` assortment and `/shop/` wheel strip; 390 | Continue native horizontal scrolling beyond both sets in each direction. Home stops at 0/1670, Shop at 0/~1762.67; repeated attempts do not cycle | Fails approved continuous infinite-carousel behavior. E6 dimensions/scrollLeft traces plus endpoint screenshots. Two full loops attempted but blocked by finite boundaries; do not report passing loops | `main/AssortmentCarousel.tsx`, `shop/ShopHomeClient.tsx`, `catalog/useLoopingTrack.ts` |
| V05 / P2 | `/shop/`; footer Help link, empty-cart context; 390 and 1440 DOM | Footer “Корзина” href `/cart/`; bottom Shop nav `/shop/cart/`; both destination pages have distinct titles/catalog links. Expected Shop cart destination from Shop footer | Loses Shop request context. E1/E8 DOM; no cart content mutated | `Footer/SiteFooter.tsx`, `shop/ShopChrome.jsx` / shared footer link assembly |
| V06 / P2 | `/tire-iq/?topic=axles#knowledge`; selected topic; 390 | “Оси” aria-current=page, but all 13 cards remain, including construction/pressure/quarry topics. Expected topic result list to match selection | Topic navigation does not narrow content. E8 rendered article text, aria-current and screenshot. Active semantic selection itself is present | `content/EditorialListing`, `TireIqListingRuntime.tsx` |
| V07 / P2 | `/`; chrome after native downward scroll; 390 | data-visibility=hidden and computed opacity 0; wrapper pointer-events none, child nav auto; wrapper has no inert. Expected hidden subtree to be noninteractive and excluded from focus | Hidden interactive header risk reproduced as deployed DOM/computed state. Exact pointer hit and full Tab sweep while hidden were not completed, so do not claim a tested accidental click | `chrome/FloatingChrome.tsx`, `FloatingChrome.module.css` |
| V08 / P3 | `/shop/wheels/forged/atlas/`; main gallery image; 390 | Computed cursor zoom-in. Click “Закрепить это фото” keeps image and opens no dialog (dialog count 0). Expected cursor/action affordance agreement | Pointer suggests enlargement that does not occur. E7 cursor + click + resulting dialog count; pin action remains valid | `catalog/CatalogProductGallery.tsx`, `TireCatalog.module.css` |
| V09 / P3 | `/tire-iq/` list and `/tire-iq/axle-role-in-tire-selection/`; default; 390 | Visible date is raw ISO timestamp, e.g. `2026-08-20T14:35:49.948Z`, rather than reader-formatted date | Long machine-oriented metadata competes with card/title rhythm. E1/E3 screenshot and article text; preserve timestamp value while formatting display | `content/EditorialListing`, `ArticleLayout`, `TireIqListingRuntime.tsx` |
| A01 / availability | `/delivery/`, `/payment/`, `/shop/delivery/`, `/shop/payment/`, `/shop/warranty/`, `/shop/become-a-supplier/`, invalid-route probe; 390 | All show home H1 under requested path instead of intended template | Deployment/hosting boundary blocks verification. E1 and visible-H1 recheck on `/delivery/`. No assertion about HTTP status or exact hosting rule was made | Deployment/static route publication; service route owners for rebuild validation |

V01's likely hidden/display conflict is a hypothesis for the next implementation investigation, not a completed root-cause claim. Source and live findings must be reconciled at the actual deployed revision before changing code.

## Recheck of every preliminary spec finding

| Preliminary item | Audit disposition |
| --- | --- |
| Shop footer cart destination | Reproduced, V05 |
| Hidden mobile header pointer/focus | Computed hidden-state mismatch reproduced, V07; pointer hit/full keyboard sweep not completed. Checkout already adds inert and hidden child pointer rule (E9), so do not blindly reimplement |
| Stale menu focus list | Deployed failure reproduced, V03. Checkout `useFocusTrap.js` already re-reads eligible targets and observes mutations. Deployment confirmation required |
| Form success announcements/focus | Not reproduced: no submissions permitted. Checkout contextual form and configured form have status/live-region and focus handling; deployed success and other forms remain unverified |
| IQ topic and axle selectors | Topic list failure reproduced, V06. Active “Оси” semantic state is present. Generic `#knowledge` axle links are present; exact promise/selection interaction beyond link targets not independently exercised |
| Cart numeric price persistence | Not reproduced: both carts empty and no writes allowed. Checkout `compactCart` explicitly preserves numeric price. Cart writes can PUT to API, so no add/reload scenario was run against preview |
| Transparent Shop slide Tab targets | Reproduced, V02. Checkout now sets tabIndex -1 for hidden links; live preview still has 0. Main strip loop is separate V04 |
| Email preferred channel optional | Not reproduced: populated cart form unavailable without cart mutation. Source CartPage email field remains optional; business validation needs a safe nonproduction scenario |
| Campaign autoplay pause/reduced-motion smooth scroll | Home campaign currently has one frame; multi-frame defect unavailable. Source has 6000 ms interval and pauses on focus/reduced-motion initialization; no claim of live pause failure from source alone. Reduced-motion execution unverified |
| Grid constraint policy debt | No true document overflow reproduced in E2. Retain policy debt as source review; hidden 0-width grids are not layout bugs |
| Product image zoom cursor vs pin | Reproduced on Atlas, V08 |

## States, limitations and next verification gates

| State | Coverage / explicit boundary |
| --- | --- |
| Valid content | Every route/variant listed above captured at 390; representative family geometry at all eight widths |
| Empty catalog | OTR and four empty Shop categories observed |
| No-match filter | Construction filter reproduced; contradictory visible cards logged V01 |
| Selected topic | Axles topic reproduced; selected link + unfiltered articles logged V06 |
| Loading | Redirect shell and first-paint image placeholders observed; no induced network failure or timing claim |
| Published-content unavailable | Source branch reviewed; not safely induced on preview. Rendered error state unavailable |
| Not-found | Invalid route returns home surface; intended error page unavailable |
| Forms | Empty field presentation observed; no submission, success, server error, live validation or personal-data entry tested |
| Carts | Empty states only. Populated lines, price reload, totals, quantity/removal, contact preference and success unavailable under read-only scope |
| Menu/filter sheet | Closed/open states and changed menu panel inspected; filter no-match tested; menu Tab failure reproduced |
| Gallery/variants | Atlas image choice/pointer cycles inspected; no order selection/cart write; rich product variants unavailable |
| Input devices | Keyboard Tab and native mouse/pointer/scroll tested. Native drag is not touch. Physical devices, touch and cross-browser remain unverified |
| Motion/contrast | No reduced-motion override or numerical contrast audit performed. Do not claim WCAG conformance or autoplay smoothness from DOM snapshots |
| Screenshot completeness | Representative 390 samples + home hero all widths viewed. Eight-width pixel comparison for every family and per-route screenshot artifacts remain unverified; only textual route captures and measured geometry are retained in this report |

Before implementation: pin the deploy revision, reconcile existing source safeguards with the preview, reproduce V01 at computed-style level, and keep the tablet/desktop composition unchanged. Before release: verify intended service/error templates on a deployment that actually contains them, run populated cart/form states on a safe local stub, test all carousel seams with sustained physical touch and reduced motion, repeat all affected shared-component consumers, and attach stable screenshots if a durable visual regression baseline is required.

## Report self-check

- Every filesystem route family in the approved scope, the additional Shop service routes, dynamic variants discovered through public links, redirect aliases and error states are listed as available, redirecting or unavailable.
- Every finding above includes location/state/viewport, impact, severity or availability classification, reproducible evidence and component owner.
- Source inference, published preview observations, emulated geometry and unverified states are separated. Fixture content is not used as published proof.
- All active carousel instances discovered are inventoried. Four slide instances and one gallery have two full directional cycles; two card strips cannot complete them due to reproduced endpoints; static/ordinary scrolling surfaces and unverified variant/device cases are explicit.
- No product, CMS, business text, price, code or pre-existing work was modified. This report records unresolved findings and verification gaps; it is not a passing visual acceptance certificate.
