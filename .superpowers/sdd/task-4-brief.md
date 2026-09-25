### Task 4: Wire into `TireModelStage` + retire grid styles

**Files:**
- Modify: `src/components/catalog/TireModelStage.tsx`
- Modify: `src/components/catalog/TireCatalog.module.css`

**Interfaces:**
- Consumes: `ModelAdvantagesCarousel`, `model.advantages`
- Produces: full-bleed advantages section between product stage and specs table

- [ ] **Step 1: Restructure stage markup**

Replace the current advantages block inside `pageInner` with a breakout outside the constrained column. Target structure:

```tsx
<main className={styles.modelPage} data-main-chrome-tone="light">
  <div className={styles.pageInner}>
    <PageHeader ... />
    <section className={styles.productStage} ...>...</section>
  </div>

  {model.advantages.length > 0 && (
    <section className={styles.advantagesBlock} aria-labelledby="advantages-title">
      <div className={styles.advantagesIntro}>
        <p className={styles.eyebrow}>РРЅР¶РµРЅРµСЂРЅР°СЏ Р»РѕРіРёРєР°</p>
        <h2 id="advantages-title">РџСЂРµРёРјСѓС‰РµСЃС‚РІР° РјРѕРґРµР»Рё</h2>
      </div>
      <ModelAdvantagesCarousel advantages={model.advantages} />
    </section>
  )}

  <div className={styles.pageInner}>
    <TireVariantsTable ... />
    {/* documents + finalCta unchanged */}
  </div>
</main>
```

Import:

```tsx
import { ModelAdvantagesCarousel } from "@/components/catalog/ModelAdvantagesCarousel";
```

Delete the old `.advantageGrid` map.

- [ ] **Step 2: Replace advantages CSS**

Remove `.advantages`, `.advantageGrid` and related mobile overrides. Add:

```css
.advantagesBlock {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: var(--section-space) 0 0;
}

.advantagesIntro {
  width: 100%;
  max-width: var(--container-max);
  min-width: 0;
  margin: 0 auto;
  padding: 0 var(--page-gutter) clamp(1.25rem, 3vw, 2rem);
}

.advantagesIntro h2 {
  margin: 0.75rem 0 0;
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 550;
  line-height: 1.05;
  letter-spacing: -0.04em;
}
```

Keep `.documents h2, .finalCta h2` rules that previously shared selectors with `.advantages h2` вЂ” update those selectors so they no longer reference `.advantages`.

In the `max-width: 767px` block, remove `.advantages` / `.advantageGrid` references.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0

- [ ] **Step 4: Manual smoke**

1. Run / use existing `next dev` (often port 3001).
2. Open a published TBR model with в‰Ґ2 features (e.g. from `/models/tbr/...`).
3. Confirm: section title, full-bleed photos, autoplay advance ~7s, РџР°СѓР·Р° stops fill, arrows/swipe work, specs table still below, no horizontal page overflow.
4. Resize to mobile: content readable above controls, chrome tone OK over dark slides.

- [ ] **Step 5: Commit (only if user asked)**

```bash
git add src/components/catalog/TireModelStage.tsx src/components/catalog/TireCatalog.module.css
git commit -m "$(cat <<'EOF'
Wire full-bleed advantages carousel into tire model PDP.

EOF
)"
```

---

