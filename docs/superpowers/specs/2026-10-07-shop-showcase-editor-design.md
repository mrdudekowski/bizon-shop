# Shop showcase editor design

## Goal

Give editors one place inside the existing CMS **Shop** section to manage the public Shop home category carousel, category presentation, and the content of `/shop/categories`.

## Current behavior

- The CMS Shop screen lists shop categories and opens category/product editors. The supplied screenshot confirms this screen is the target for a new separate tab.
- The public `/shop` page reads `shop-home` page content. Its `categoryCarousel` is currently edited in the Pages > Магазин editor.
- The public `/shop/categories` page builds tiles from published categories. Its headline and lead are hardcoded in the public component.
- Category icon, visibility, order, and images are currently category fields and are also used by other Shop presentation surfaces. Category identity and product relationships must remain valid for category routes and products.

## Proposed CMS experience

Add a dedicated **Витрины** tab to the existing CMS Shop section shown in the screenshot. Keep the current category/product workflow intact. The new tab contains three clearly separated editing panels:

1. **Карусель главной Shop** — manage existing carousel slides, including order, copy, links, and desktop/mobile images.
2. **Плитки категорий** — select existing Shop categories, control tile visibility and order, and edit tile title, icon/image, and presentation.
3. **Контент каталога Shop** — edit the SEO title/description and the visible copy on `/shop/categories` (hero eyebrow, title, lead, and section heading).

The data for these three panels is saved on the existing Shop page draft (`shop-home`) and published through the existing page workflow. The category tile configuration refers to existing category IDs. Category records remain authoritative for category identity, slug/route, product relationships, and publication status; the Shop page draft owns user-facing presentation configuration, including tile title, icon/image, order, and visibility. Where the same category presentation is reused elsewhere on the public Shop site, use the Shop page configuration as the source of truth to avoid a second editor for those fields.

Move the carousel editor out of the Pages > Магазин editor so the same slide data has one editing location. The existing Pages > Магазин item continues to manage the remaining Shop home content.

## Public rendering and fallback

- `/shop` reads the published `shop-home` content as it does today, including its category carousel.
- `/shop/categories` reads the published Shop page content for its copy and tile configuration, and resolves tile destinations against the referenced published categories.
- Preserve code defaults when optional copy fields are empty. Hide a configured tile if its referenced category is unavailable or unpublished; do not generate a dead link.
- Existing Shop category icon/order/visibility data must be carried into the initial Shop page configuration so the migration does not silently change the existing public output. Existing public output remains unchanged until the new Shop page draft is published.

## Data and migration constraints

- Keep all editable display data on the existing `shop-home` page record; do not create a tenth general Pages entry or a duplicate category table.
- Reuse the existing page draft/publish/revision workflow and media asset placement model.
- Provide a backward-compatible default for current `shop-home` records that do not yet contain the new catalog fields.
- Seed/backfill the Shop page's tile configuration from current category presentation so existing icons, order, and visibility are preserved when the new reader becomes active.
- Preserve unrelated draft fields and the current Shop category/product relations.

## Acceptance criteria

- CMS Shop has a distinct tab for the three showcase editing panels.
- Editors can add, remove, reorder, and update home carousel slides and category tile presentation from that tab.
- Catalog page copy is editable there and appears on `/shop/categories` after publication.
- Tile links always target the selected category's canonical route; category/product ownership remains unchanged.
- The Pages > Магазин editor no longer exposes a second editor for the same carousel data.
- The Shop category editor no longer exposes duplicate controls for presentation fields moved to the Shop page; it continues to manage category identity and product relationships.
- Existing drafts without the new fields render using current code defaults.
- Saving, reloading, publishing, and reloading the public pages preserves the configured content and media.

## Out of scope

- Rebuilding category/product administration or moving category/product records into the `shop-home` page.
- Changing route slugs, product assignments, category publication rules, or other Shop page content.
- Adding a new top-level Pages registry item for `/shop/categories`.
