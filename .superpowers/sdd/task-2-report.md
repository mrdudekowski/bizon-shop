# Task 2 report — Шины

**Status:** done  
**Commit:** `f8c16eb` — Finish tire directions and the tire model document.  
**tsc:** `npx tsc --noEmit` exit 0

## Delivered

- `PlacementFields` (+ CSS module): file → `createAsset`, alt, focal/crop numbers 0..1, preview `object-position`
- Tire list: name search, filter все / на сайте / скрыто, create flow
- Tire model editor: tech size columns, gallery выше/ниже, advantages, PDF, menu fields, PlacementFields, lastSavedBy/lastPublishedBy, role-gated publish/hide/delete
- Tire direction list → document; `TireDirectionEditor` + `/tires/directions/[id]`; no axles; create by name

## Concerns

- Home `src/app/page.tsx` already wires `TireModelList` in the working tree but was left uncommitted (out of Task 2 file list); until that lands, `/` may still be a placeholder while `/tires/[id]` and directions routes work.
- Direction API has no hide/delete; editor exposes save + admin publish only.
- Placement preview resolves `dataUrl` via `listAssets()` on each placement (fine for local store; noisy if asset lists grow).
