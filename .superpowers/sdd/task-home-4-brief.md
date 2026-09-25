### Task 4: Wire homepage entry

**Files:**
- Modify: `src/components/main/TireSelectionEntry.tsx`
- Modify: `src/app/(site)/page.tsx`

**Interfaces:**
- Consumes: `HomeSelectionPanel`, `getPublishedTireCatalog` result already on page
- Produces: home renders panel with catalog + CMS copy

- [ ] **Step 1: Replace TireSelectionEntry body**

```tsx
import type { PageShell } from "@/lib/cms/pages/types";
import type { TireCatalogReadModel } from "@/lib/catalog/tireReadModel";
import { HomeSelectionPanel } from "./HomeSelectionPanel";

export function TireSelectionEntry({
  content,
  catalog,
}: {
  content: PageShell;
  catalog: TireCatalogReadModel;
}) {
  return <HomeSelectionPanel content={content} catalog={catalog} />;
}
```

Remove old `Link` grid.

- [ ] **Step 2: Pass catalog from home page**

In `src/app/(site)/page.tsx`:

```tsx
<TireSelectionEntry content={page.selectionEntry} catalog={catalog} />
```

Wrap panel in `Suspense` if `useSearchParams` requires it (Next.js):

```tsx
import { Suspense } from "react";
// вЂ¦
<Suspense fallback={null}>
  <TireSelectionEntry content={page.selectionEntry} catalog={catalog} />
</Suspense>
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0

- [ ] **Step 4: Manual smoke**

1. Open `http://localhost:3001/#solutions` вЂ” 2Г—2 vehicle cards.
2. Complete path to result without leaving `/`.
3. Confirm URL gains query + stays on `/`.

- [ ] **Step 5: Commit (only if user asked)**

```bash
git add src/components/main/TireSelectionEntry.tsx src/app/(site)/page.tsx
git commit -m "Wire inline selection panel into the homepage."
```

---

