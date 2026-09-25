### Task 2: Keep choice grids 2Г—2 on all breakpoints

**Files:**
- Modify: `src/components/selection/Selection.module.css`
- Modify: `src/components/main/MainHome.module.css` (vehicle grid used by old entry вЂ” update or remove later; fix now so any leftover matches)

**Interfaces:**
- Consumes: existing `.choiceGrid` / `.vehicleGrid` class names
- Produces: mobile no longer collapses to 1 column

- [ ] **Step 1: Patch Selection.module.css**

Find the mobile rule that sets `.choiceGrid { grid-template-columns: 1fr; }` (around the `max-width: 767px` block) and **delete that override** so base `repeat(2, minmax(0, 1fr))` remains.

Optionally densify:

```css
.choiceCard {
  min-height: 10rem;
  /* keep other props */
}
```

- [ ] **Step 2: Patch MainHome.module.css vehicleGrid**

Change base and breakpoints:

```css
.vehicleGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  /* keep borders */
}
.vehicleGrid > a {
  min-height: clamp(10rem, 22vw, 14rem);
  /* reduce from 18вЂ“28rem */
}
```

In `@media (max-width: 1023px)` remove any 4-col assumption if present (already 2).  
In `@media (max-width: 767px)` **remove** `.vehicleGrid { grid-template-columns: 1fr; }` override.

- [ ] **Step 3: Visual check**

Open `/selection` (still works until Task 5) or storybook-less: confirm choice cards stay 2-wide at ~390px width in DevTools.

- [ ] **Step 4: Commit (only if user asked)**

```bash
git add src/components/selection/Selection.module.css src/components/main/MainHome.module.css
git commit -m "Keep selection choice grids two columns on mobile."
```

---

