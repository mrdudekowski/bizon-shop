# BIZON Catalog Import Templates

CSV templates for bulk catalog loading. Imported by `npm run import:catalog` (`scripts/import-catalog.ts`).

## Files

| File | Collection | Required columns |
|------|------------|------------------|
| `tire-types.csv` | `tire-types` | `slug`, `name` |
| `tire-models.csv` | `tire-models` | `slug`, `name`, `tireTypeSlug`, `applicationCategory` |
| `tire-variants.csv` | `tire-variants` | `modelSlug`, `size` |
| `wheel-types.csv` | `wheel-types` | `slug`, `name` |
| `wheel-models.csv` | `wheel-models` | `slug`, `name`, `wheelTypeSlug` |
| `wheel-variants.csv` | `wheel-variants` | `modelSlug`, `sizeLabel` |
| `shop-categories.csv` | `shop-categories` | `slug`, `name` |
| `shop-products.csv` | `products` | `slug`, `name`, `shopCategorySlug` |

## Import order

The importer runs files in dependency order (types → models → variants → shop).

```bash
npm run import:catalog          # upsert from import-templates/
npm run import:catalog:dry      # preview without writes
npm run seed:all                # import:catalog + seed:content
```

## Rules

1. Missing required field → row rejected (logged, exit 1).
2. Existing `slug` / `sku` → **update**.
3. New `slug` / `sku` → **create**.
4. Invalid relationship slug → **error**, row skipped.
5. Never import tires/wheels as `products`.

Media import is not in MVP — upload via Payload admin or a future `media.csv` phase.
