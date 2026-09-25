### Task 7: Fix broken tests / tsc / lint; smoke Admin on staging

**Files:**
- Modify: any remaining failing tests referencing verification, ModelFeatures, catalogId, advantages
- Touch: `scripts/import-tbr-catalog.ts` / `src/lib/catalog/tbrImport.ts` only as needed to compile (may no-op or document deprecated)

- [ ] **Step 1: Full unit test run**

Run: `npx vitest run`

Fix failures by updating expectations to the new schema вЂ” do not reintroduce verification gates.

- [ ] **Step 2: Typecheck + lint**

```powershell
npx.cmd tsc --noEmit
npm.cmd run lint
```

Expected: clean (or only pre-existing unrelated issues вЂ” do not expand scope)

- [ ] **Step 3: Manual smoke (staging DB + local server)**

```powershell
$env:DATABASE_URI='postgresql://postgres:postgres@127.0.0.1:55433/bizon_payload_stage'
# start next on 3001 as project usual
```

In `/admin`:
1. Open РњРѕРґРµР»Рё С€РёРЅ вЂ” columns show name/type/status (no verification).
2. Open a model вЂ” tabs: РїСЂРµРёРјСѓС‰РµСЃС‚РІР° (features array), СЂР°Р·РјРµСЂС‹ (join), РјРµРґРёР°.
3. Create draft model without image вЂ” save OK; set published вЂ” error in Russian about image.
4. Add variant size вЂ” sku auto-filled; publish model then variant.
5. Public `/models/tbr` (or actual type slug) вЂ” model appears only with published variant; empty price shows В«РџРѕ Р·Р°РїСЂРѕСЃСѓВ».

- [ ] **Step 4: Commit any test/script fixes**

```bash
git add -A
git commit -m "test(tires): align suite with manager UX catalog schema"
```

---


