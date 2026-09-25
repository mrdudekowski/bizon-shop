# Task 3 report — Диски и shop

**Status:** done  
**Commit:** `aa3d8d4` — Finish wheel and shop documents.  
**tsc:** `npx tsc --noEmit` exit 0

## Delivered

- Wheel type document: `WheelTypeEditor` + `/wheels/types/[id]`; list links and create navigates to editor
- Wheel model editor: series/material/construction/fitment, both descriptions, menu, main image, gallery выше/ниже, PDF `{assetId,title}`, full variant rows; save/publish bar with role gate
- Shop category document: `ShopCategoryEditor` + `/shop/categories/[id]`; list links and create navigates to editor
- Shop product editor: category, both descriptions, product price/priceOnRequest, main image, gallery выше/ниже, variant rows with own price and PlacementFields image; save/publish bar with role gate
- CSS modules with explicit `grid-template-columns`, `min-width: 0`, `width`/`max-width: 100%`
- No hide/delete (client has none for wheels/shop)

## Concerns

- No `getWheelType` / `getShopCategory` on the client; editors load via list + id match
- Shop category publish blockers reuse `wheelTypePublishBlockers` (same identity shape; matches localStore)
