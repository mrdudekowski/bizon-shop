# BIZON public styles: audit and cleanup

Date: 2026-11-25
Scope: public storefront and marketing site only. CMS and backend were excluded.
Production reference: [BIZON production site](https://mrdudekowski-bizon-shop-931a.twc1.net/).

## Summary

- Inventory covered 54 public CSS files (9,667 lines after cleanup) under `src`; the admin app was not inspected or changed in this pass.
- Consolidated repeated palette literals and repeated font weights, font sizes, and line heights into semantic tokens owned by `src/app/globals.css`. The first scan found 38 uses of exact palette colors duplicated outside the token file and 119 repeated weight declarations; migration was applied across the active public CSS modules.
- Removed nine unreferenced legacy public component/hook files and their exclusive global styles, plus an unused canvas-color helper and its helper-only test. Kept shared global components/styles and the active `PRODUCTS` section identifier.
- No production deployment was performed. The live links below currently serve the existing production bundle; source changes require the normal manual deployment before live verification.

## Visual references and findings

The route pairs are comparison locations for the affected elements. In the current source, several values were hardcoded but numerically identical to the canonical token, so they were maintenance/SSOT defects rather than a visible color difference. Production has not received these source changes, so an after-deploy comparison remains outstanding.

Routes previously opened during the public-site audit: `/`, `/shop/`, `/shop/wheels/forged/`, `/shop/wheels/forged/atlas/`, `/models/`, `/models/tbr/`, `/models/otr/`, `/branding/`, `/about/`, `/shop/categories/`, `/tire-iq/`, `/tire-iq/construction-route-tire-check/`, `/contact/`, `/delivery/`, and `/warranty/`. The production sitemap contained 71 URLs; the other routes were not individually opened in this pass.

| Canonical treatment | Former hardcoded treatment | Finding |
| --- | --- | --- |
| [Tire model catalog](https://mrdudekowski-bizon-shop-931a.twc1.net/models/tbr/) | [OTR model catalog](https://mrdudekowski-bizon-shop-931a.twc1.net/models/otr/) | Repeated card and body typography values now resolve through public type/weight/leading tokens. Compare like-for-like catalog cards; the migration preserves their previous computed values. |
| [Forged wheels catalog](https://mrdudekowski-bizon-shop-931a.twc1.net/shop/wheels/forged/) | [Atlas wheel configurator](https://mrdudekowski-bizon-shop-931a.twc1.net/shop/wheels/forged/atlas/) | Wheel order-panel off-state gradient and wheel-cover neutral surface now use named global tokens. This removes duplicated visual decisions from the active module. |
| [Tire model catalog](https://mrdudekowski-bizon-shop-931a.twc1.net/models/tbr/) | [Delivery page](https://mrdudekowski-bizon-shop-931a.twc1.net/delivery/) | Useful route pair for reviewing compact card copy against long-form page copy. Their 1.5 and 1.6 line-height roles are intentionally distinct; they are tokenized separately and were not flattened into one value. |

### Confirmed source changes

- Exact palette values repeated across public modules were replaced with the existing Bizon palette/semantic variables. Scrollbars, inverse surfaces, and the linear color stops inside shared campaign gradients now use those same tokens.
- Repeated font-weight values (400, 500, 600, 650, 700, 800), common sizes (12, 13, 14, 16px), and common line heights (1.45, 1.5, 1.6) were mapped to named public type tokens without changing their numeric values.
- Consolidated every active CSS `rgb()`/`rgba()` into `color-mix()` expressions that reference canonical solid color tokens. The white/black, neutral, coral, mint, photo, glass, and scrim bases now have one owner in `globals.css`; the alpha percentages remain local to the state/overlay that uses them.
- Tire card title weight/copy leading, wheel switch-off gradient, wheel-cover neutral background, and custom select border/focus/active colors now use canonical values.
- Dedicated semantic tokens now own the Doloto footer gold/cream, homepage deep and near-black surfaces, and the two switch-off gradient stops. These remain distinct visual roles rather than being incorrectly mapped to approximate palette colors; original values are preserved.
- Removed legacy source files: `Hero.jsx`, `Header.jsx`, `ProductsSection.jsx`, `ProductCarousel.jsx`, `FeaturesSection.jsx`, `ApplicationsSection.jsx`, `ContactSection.jsx`, `AccessoriesSection.jsx`, and `useScrollToSection.js`. Their old global header, hero, carousel, feature, application, contact, and accessory-banner rules were removed. Shared cart/button/section/card rules were retained.
- Removed `src/components/main/canvasColor.ts` and its test after the source scan showed that only the test imported the helper; no public runtime path consumed it. Its CSS scroll-driven canvas implementation remains active.
- `src/constants/sections.js` now retains only the `PRODUCTS` key, still consumed by the active back-to-top behavior.

## Remaining literal values and exceptions

- `@property --page-canvas` and `@property --page-ink` keep literal `initial-value` colors because registered custom properties require a computationally independent initial value; `var()` cannot be used there. The homepage repeats these same registration defaults for its own registered properties.
- Context-specific image overlays, translucent chrome, carousel indicators, and shadows still have different alpha percentages. Their base colors now resolve through tokens; the percentages remain per component/state to preserve photo treatment.
- `--color-surface-home-dark`, `--color-surface-near-black`, and overlay base tokens preserve bespoke site art direction; switch endpoints and Doloto brand colors are distinct documented roles, not duplicates of the neutral scale.
- The inline SVG select chevron encodes its stroke in a data URI. It remains a separate vector asset value, not a CSS color declaration.
- Manifest/theme metadata uses the same white/ink hex values because those APIs require literal strings rather than CSS variables. The mask-icon color was aligned to the canonical neutral-900 value.

## Canonical colors used by the public site

The following 34 solid values are referenced by active public styles or public theme metadata. CSS components use their named tokens; the literals are owned by the root token set, with metadata literals required by the framework APIs.

| Role | Values |
| --- | --- |
| Coral | `#ea7a60`, `#e45433`, `#c93b1b` |
| Mint | `#44eace`, `#06e3be`, `#05c1a2`, `#04947c` |
| Neutral and surfaces | `#f5f5f5`, `#e9e9e9`, `#b5b5b5`, `#696969`, `#363636`, `#1c1c1c`, `#232323`, `#fafafa`, `#0a0a0a`, `#101010` |
| Base/status | `#000000`, `#ffffff`, `#b42318` |
| Brand and contextual surfaces | `#c8a96e`, `#f7f5f0`, `#101313`, `#111111`, `#080a0a`, `#080a0c`, `#050707`, `#0a0c0c`, `#141616`, `#121515`, `#f8f9f8`, `#0a0e12`, `#b3b3b3`, `#e6e6e6` |

Translucent variants use these same base tokens with component-specific alpha in `color-mix()`. `transparent` is used as the mix endpoint. Runtime canvas transitions also interpolate between the canonical white, near-black, and ink values.
- CMS-authored runtime markup and production database content were not available for a complete persisted-selector audit. Deleted legacy selectors were checked against public source references; this limitation is relevant to custom HTML that might manually use retired class names.

## Dead-code evidence and boundaries

Reference scan across public `src/**/*.{js,jsx,ts,tsx,css}` found no imports/references to the removed component paths or their exclusive old selectors. `BurgerToggle`, `CartHeaderButton`, shared `.cart-button`, shared section/card styles, and other active chrome were retained. The static scan does not prove that external/persisted HTML uses no hand-authored legacy class names.

Root checkout was already dirty before this slice. Unrelated contact/cart work, scripts, temporary files, `.gitignore`, and existing user changes in `Footer.module.css` (including its footer wrapping breakpoint and accent-link behavior) were preserved. No CMS or backend files were edited.

## Verification

- `git diff --check`: PASS (Git emitted line-ending normalization warnings for edited CSS files; no whitespace errors).
- Public CSS reference scan for the removed legacy component names/selectors: PASS, no matches (the homepage's separate `.homeFeatureCard` is active and intentionally remains).
- Active CSS color scan: PASS; active modules reference variables, and literal colors remain only in the canonical root token definitions plus required `@property initial-value` declarations.
- Automated tests, typecheck, and build: NOT RUN.
- Browser review of a local bundle and post-deployment visual comparison: NOT RUN. The live production routes above still show the deployed version until a manual deployment is made.
- No files were staged, committed, pushed, or deployed.
