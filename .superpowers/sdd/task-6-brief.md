### Task 6: Staging seed + verify end-to-end

**Files:** none (ops) вЂ” optional README one-liner if `seed:wheel-media` is undocumented

- [ ] **Step 1: Ensure models exist on staging**

```bash
cross-env DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:55433/bizon_payload_stage npm run seed:wheel-axis
```

- [ ] **Step 2: Upload media**

```bash
cross-env DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:55433/bizon_payload_stage npm run seed:wheel-media
```

Expected: 5 Г— (1 hero + 3 gallery) linked. Re-run idempotent.

- [ ] **Step 3: Readiness**

```bash
cross-env DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:55433/bizon_payload_stage npm run verify:shop
```

Expected: JSON `ok: true` (or no `FORGED_*` blockers).

- [ ] **Step 4: Manual site check**

With `DATABASE_URI` pointing at staging, run `npm run dev`, open:

1. `/shop/wheels/forged` вЂ” five CMS cards with Media URLs  
2. `/shop/wheels/forged/atlas` вЂ” hero + gallery + configurator  
3. Add to cart вЂ” `itemId` is CMS id (not `atlas`)  
4. `/shop` вЂ” three forged cards use Media URLs  

- [ ] **Step 5: Final grep**

```bash
rg "SHOP_WHEEL_DESIGNS|getShopWheelDesignBySlug" src/app src/components
```

Expected: no matches.

- [ ] **Step 6: Commit only if README / docs touch**

If you added a README note for `seed:wheel-media`, commit it; otherwise no commit.

---

## Spec coverage checklist

| Spec requirement | Task |
|---|---|
| Idempotent media seed from public PNGs | Task 2 |
| hero в†’ mainImage; 3 views в†’ gallery | Task 2 |
| Mapper exposes gallery | Task 1 |
| Remove forged bypass in type + model routes | Task 4 |
| Keep ForgedCatalog / ForgedModel shell | Task 3 |
| Cart uses CMS id | Task 3 |
| Sitemap / shop home off static forged heroes | Task 5 |
| Readiness requires CMS mainImage | Task 5 |
| Staging first | Task 6 |
| `SHOP_WHEEL_DESIGNS` seed-only | Tasks 2вЂ“5 |
| No glass UI / no tire-parity | Global constraints |

## Plan self-review

1. Spec coverage: all MVP rows mapped to tasks; non-goals excluded.  
2. Placeholders: none вЂ” seed script and view helper fully specified.  
3. Types: `CmsWheelGalleryImage` / `ForgedWheelView` / cart `itemId: model.id` consistent across Tasks 1вЂ“4.  
4. Finish field: `series` documented (YAGNI vs new field).
