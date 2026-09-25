### Task 1: Home selection URL helpers

**Files:**
- Create: `src/lib/selection/homeHref.ts`
- Create: `src/lib/selection/homeHref.test.ts`
- Modify: `src/lib/selection/urlState.ts` only if exporting shared pieces is cleaner (prefer **not** вЂ” keep helpers separate)

**Interfaces:**
- Consumes: `SelectionState`, `SelectionStep`, `serializeSelectionParams`
- Produces:
  - `selectionHomeHref(state?: SelectionState, step?: SelectionStep): string`
  - `selectionLegacyToHomePath(search: string): string` вЂ” `search` is `URLSearchParams.toString()` or raw query without `?`

- [ ] **Step 1: Write failing tests**

Create `src/lib/selection/homeHref.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { selectionHomeHref, selectionLegacyToHomePath } from "./homeHref";

describe("selectionHomeHref", () => {
  it("anchors empty selection on #solutions", () => {
    expect(selectionHomeHref()).toBe("/#solutions");
  });

  it("serializes state and step onto /", () => {
    expect(
      selectionHomeHref(
        {
          vehicle: "regional-truck",
          conditions: ["regional"],
          axle: "drive",
          sizeKnown: false,
        },
        "result",
      ),
    ).toBe(
      "/?vehicle=regional-truck&condition=regional&axle=drive&sizeKnown=false&step=result#solutions",
    );
  });
});

describe("selectionLegacyToHomePath", () => {
  it("moves /selection query onto / with hash", () => {
    expect(selectionLegacyToHomePath("vehicle=long-haul-tractor&step=conditions")).toBe(
      "/?vehicle=long-haul-tractor&step=conditions#solutions",
    );
  });

  it("handles empty query", () => {
    expect(selectionLegacyToHomePath("")).toBe("/#solutions");
  });
});
```

- [ ] **Step 2: Run tests вЂ” expect FAIL**

```bash
npx vitest run src/lib/selection/homeHref.test.ts
```

Expected: FAIL (module missing)

- [ ] **Step 3: Implement helpers**

Create `src/lib/selection/homeHref.ts`:

```ts
import type { SelectionState, SelectionStep } from "./types";
import { serializeSelectionParams } from "./urlState";

export function selectionHomeHref(
  state?: SelectionState,
  step?: SelectionStep,
): string {
  const params = state ? serializeSelectionParams(state) : new URLSearchParams();
  if (step) params.set("step", step);
  const query = params.toString();
  return query ? `/?${query}#solutions` : "/#solutions";
}

/** `search` = query string without leading `?` (as from `URLSearchParams.toString()`). */
export function selectionLegacyToHomePath(search: string): string {
  const query = search.replace(/^\?/, "");
  return query ? `/?${query}#solutions` : "/#solutions";
}
```

- [ ] **Step 4: Run tests вЂ” expect PASS**

```bash
npx vitest run src/lib/selection/homeHref.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit (only if user asked)**

```bash
git add src/lib/selection/homeHref.ts src/lib/selection/homeHref.test.ts
git commit -m "Add home hash href helpers for inline tire selection."
```

---

