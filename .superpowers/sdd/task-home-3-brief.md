### Task 3: `HomeSelectionPanel` client wizard

**Files:**
- Create: `src/components/main/HomeSelectionPanel.tsx`
- Modify: `src/components/main/MainHome.module.css` (panel layout under `.selectionEntry`)

**Interfaces:**
- Consumes:
  - `catalog: TireCatalogReadModel`
  - `content: PageShell` (eyebrow/title/lead from `page.selectionEntry`)
  - `selectionHomeHref`, `parseSelectionParams`, `serializeSelectionParams`, `getFirstMissingStep`, `recommendTires`
  - Step components: `VehicleTypeStep`, `OperatingConditionsStep`, `FitmentStep`, `SelectionResult`, `SelectionProgress`
- Produces: `<HomeSelectionPanel catalog={вЂ¦} content={вЂ¦} />` with `id="solutions"`

- [ ] **Step 1: Implement panel**

Create `src/components/main/HomeSelectionPanel.tsx` modeled on `SelectionWizard.tsx`, with these differences:

1. `"use client"`.
2. Root `<section className={styles.selectionEntry} id="solutions" data-main-chrome-tone="light">`.
3. Static heading from `content` (eyebrow/title/lead) always visible.
4. Href builder uses `selectionHomeHref(state, step)` instead of `/selection?вЂ¦`.
5. `router.replace` / `router.push` with `{ scroll: false }`.
6. **Back** = explicit previous step via `advance`/`syncDraft` to prior step in `STEP_ORDER` (not `router.back()`).
7. One-time deep-link scroll:

```ts
useEffect(() => {
  if (typeof window === "undefined") return;
  if (!window.location.hash.includes("solutions") && !window.location.search) return;
  document.getElementById("solutions")?.scrollIntoView({ block: "start" });
}, []);
```

8. Empty catalog: if `catalog.directions.length === 0`, render failure copy + contact CTA inside the section (mirror selection page messaging).
9. Reuse `Selection.module.css` for wizard guts via `import selectionStyles from "@/components/selection/Selection.module.css"` **or** wrap steps in a `div` with a home-local class; prefer importing selection module classes for progress/actions/fieldset to avoid duplication.
10. Focus step legend on step change (same as wizard).

Skeleton (adapt fully вЂ” do not leave stubs):

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { FitmentStep } from "@/components/selection/FitmentStep";
import { OperatingConditionsStep } from "@/components/selection/OperatingConditionsStep";
import { SelectionProgress } from "@/components/selection/SelectionProgress";
import { SelectionResult } from "@/components/selection/SelectionResult";
import { VehicleTypeStep } from "@/components/selection/VehicleTypeStep";
import selectionStyles from "@/components/selection/Selection.module.css";
import type { TireCatalogReadModel } from "@/lib/catalog/tireReadModel";
import type { PageShell } from "@/lib/cms/pages/types";
import { recommendTires } from "@/lib/selection/engine";
import { selectionHomeHref } from "@/lib/selection/homeHref";
import type { SelectionState, SelectionStep } from "@/lib/selection/types";
import {
  getFirstMissingStep,
  parseSelectionParams,
} from "@/lib/selection/urlState";

import styles from "./MainHome.module.css";

const STEP_ORDER: SelectionStep[] = ["vehicle", "conditions", "fitment", "result"];

function resolveStep(params: URLSearchParams, state: SelectionState): SelectionStep {
  const missing = getFirstMissingStep(state);
  const requested = params.get("step") as SelectionStep | null;
  if (!requested || !STEP_ORDER.includes(requested)) return missing;
  if (STEP_ORDER.indexOf(requested) > STEP_ORDER.indexOf(missing)) return missing;
  return requested;
}

function previousStep(step: SelectionStep): SelectionStep | null {
  const index = STEP_ORDER.indexOf(step);
  return index > 0 ? STEP_ORDER[index - 1] : null;
}

export function HomeSelectionPanel({
  catalog,
  content,
}: {
  catalog: TireCatalogReadModel;
  content: PageShell;
}) {
  // вЂ¦ mirror SelectionWizard state machine using selectionHomeHref вЂ¦
}
```

Implement the full state machine by copying from `SelectionWizard.tsx` and swapping href + back behavior + section chrome.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0

- [ ] **Step 3: Commit (only if user asked)**

```bash
git add src/components/main/HomeSelectionPanel.tsx src/components/main/MainHome.module.css
git commit -m "Add homepage inline tire selection panel."
```

---

