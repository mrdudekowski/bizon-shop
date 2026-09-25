### Task 6: Regression pass

**Files:** test-only / minor link fixups

Work from: `C:/Users/HP/Documents/Cursor projects/Commersial/Bizon`
Branch: `feat/home-inline-selection`
Base of feature: `c5f5620`
Do **not** stage unrelated WIP in the dirty working tree.

- [ ] **Step 1: Full focused suite**

```bash
npm test
npx tsc --noEmit
```

Expected: all green

- [ ] **Step 2: Manual checklist** (browser if dev server available on localhost:3000 or 3001; note which)

- [ ] Mobile ~390px: vehicle step 2×2, section not full-viewport-tall empty
- [ ] conditions multi-select + continue
- [ ] fitment axle row + size field
- [ ] result cards + contact query includes selection params
- [ ] deep link `/?vehicle=regional-truck&condition=regional&axle=drive&sizeKnown=false&step=result#solutions`
- [ ] `/selection?vehicle=regional-truck` lands on home with hash (verify Location still has `#solutions`)
- [ ] empty catalog path (if easy to simulate) or code-review the empty branch in HomeSelectionPanel

- [ ] **Step 3:** Only commit if you must fix failures — message describing the fix. Otherwise no commit.

Write report to `.superpowers/sdd/task-home-6-report.md` with status DONE / DONE_WITH_CONCERNS / BLOCKED, test output summary, and manual smoke results.
