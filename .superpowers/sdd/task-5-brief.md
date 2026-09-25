### Task 5: Regression suite + optional e2e note

**Files:**
- Test only (no new product files unless e2e already covers catalog PDP)
- Optional modify: `e2e/catalog.spec.ts` only if a stable advantages assertion is cheap

**Interfaces:**
- Consumes: Tasks 1вЂ“4 deliverables

- [ ] **Step 1: Run unit suite for touched modules**

```bash
npx vitest run src/lib/catalog/featureImages.test.ts src/lib/cms/payload/mappers.test.ts
```

Expected: PASS

- [ ] **Step 2: Optional e2e (skip if no features in fixture env)**

If `e2e/catalog.spec.ts` already opens a model page, add a soft check:

```ts
await expect(page.getByRole("heading", { name: "РџСЂРµРёРјСѓС‰РµСЃС‚РІР° РјРѕРґРµР»Рё" })).toBeVisible();
await expect(page.getByRole("region", { name: "РџСЂРµРёРјСѓС‰РµСЃС‚РІР° РјРѕРґРµР»Рё" })).toBeVisible();
```

Only add if the seeded/staging model is guaranteed to have features; otherwise leave a comment in the PR/plan notes and rely on manual smoke.

- [ ] **Step 3: Final typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0

- [ ] **Step 4: Commit (only if user asked)**

```bash
git add e2e/catalog.spec.ts
git commit -m "$(cat <<'EOF'
Cover model advantages carousel visibility in catalog e2e.

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Full-bleed shop-like scale | 3, 4 |
| Text overlay, no CTA | 3 |
| Static images by `key` (`1b`вЂ“`17b`) | 1 |
| New `ModelAdvantagesCarousel` | 3 |
| Map `key` on advantages | 2 |
| Title above + `aria-label` on carousel | 4, 3 |
| `data-main-chrome-tone="dark"` on carousel | 3 |
| Autoplay / progress / pause / arrows / swipe / reduced-motion | 3 |
| Empty advantages в†’ hide section | 4 |
| Single slide в†’ no multi controls | 3 |
| Missing image в†’ dark fallback | 3 |
| Unit tests for mapper + image SSOT | 1, 2 |
| Wheels out of scope | (none) |
| No Payload migration | 2 |

## Self-review notes

- Filename extension: PNG (not JPG) вЂ” intentional, matches source assets.
- Commit steps are optional per repo user rule; agents must not commit unless the user asks.
- Carousel CSS should be adapted from shop, not imported as shared dependency (YAGNI; avoids coupling shop and catalog).
