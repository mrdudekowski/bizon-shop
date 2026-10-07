# CMS catalog view switch design

## Goal

Let CMS users switch supported catalog screens between the existing compact list and a visual tile grid, while preserving existing editing, publication, filtering, and deletion workflows.

## Scope

Add the switch to:

- Tire models after a direction is selected (`/` with `direction` query).
- Tire direction management (`/tires/directions`).
- Wheel models (`/wheels`).
- Shop categories (`/shop`, category tab).
- Materials (`/materials`).
- Site pages (`/pages`).

The initial tire-direction chooser remains as it is. Shop products inside a category, files, publications, users, and editor form sections are outside this view-switch scope.

## View selection

- Provide explicit, accessible `Список` and `Плитки` controls on every in-scope list.
- Keep the selected view independently per section in browser storage.
- If the user has not selected a view for that section, choose tiles when the unfiltered collection has 6 or fewer items and list when it has more than 6.
- A saved user choice takes precedence over the automatic default.
- Search and status filters affect displayed items in either view, not the collection count used to select the default.

## Tile design

- Use a responsive grid of square tiles with rounded corners.
- Fill each tile with its existing item image using `object-fit: cover`; use a bottom gradient for readable white text.
- Place the title over the image and preserve useful secondary metadata, such as model size count, slug, or category product count.
- When an item has no image, use a neutral surface and the existing section icon.
- Keep the whole tile as the edit/navigation target. Keep publication state controls and existing delete actions available in tile mode without making the card difficult to open.
- Preserve current list appearance and behavior as the list option.

## Implementation shape

Reuse the existing `CatalogRow` data and actions, adding a tile presentation and shared view control rather than duplicating entity-specific behavior. Add a small shared preference helper keyed by section so each catalog remembers its own selection. Keep the current tire direction-card presentation separate from the new presentation used by catalog rows.

## Validation

Verify all six entry points, automatic defaults at counts 6 and 7, saved per-section choices, image and no-image tiles, and preservation of status/delete/navigation/filter behavior. Check responsive layout at desktop and mobile widths, including grid sizing and overflow constraints from the repository CSS guidance.
