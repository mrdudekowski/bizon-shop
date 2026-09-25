# Task 1 Report: Home selection URL helpers

**Status:** DONE

**Branch:** `feat/home-inline-selection`

**Commit:** `c791da98d2b0dfc276efee92804e6264ddc065b7`

---

## Summary

Added `selectionHomeHref` and `selectionLegacyToHomePath` helpers for inline tire selection on the home page. Both functions anchor on `/#solutions` and reuse existing `serializeSelectionParams` for state serialization. TDD cycle completed; all tests pass. No changes to `urlState.ts`.

---

## TDD Evidence

### RED (Step 2)

```
npx vitest run src/lib/selection/homeHref.test.ts
```

```
 FAIL  src/lib/selection/homeHref.test.ts
Error: Cannot find module './homeHref' imported from .../homeHref.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```

### GREEN (Step 4)

```
npx vitest run src/lib/selection/homeHref.test.ts
```

```
 Test Files  1 passed (1)
      Tests  4 passed (4)
   Duration  1000ms
```

---

## Files Created

- `src/lib/selection/homeHref.ts`
- `src/lib/selection/homeHref.test.ts`

---

## Interfaces

### `selectionHomeHref(state?, step?)`

Builds a home-page href with optional selection state and step query params, always ending with `#solutions`.

| Input | Output |
|-------|--------|
| (none) | `/#solutions` |
| state + step | `/?vehicle=...&condition=...&axle=...&sizeKnown=...&step=...#solutions` |

Uses `serializeSelectionParams` from `urlState.ts` for canonical param encoding.

### `selectionLegacyToHomePath(search)`

Migrates legacy `/selection?...` query strings to home paths with hash anchor.

| Input | Output |
|-------|--------|
| `""` | `/#solutions` |
| `vehicle=long-haul-tractor&step=conditions` | `/?vehicle=long-haul-tractor&step=conditions#solutions` |

Strips a leading `?` if present (defensive, not covered by tests).

---

## Test Coverage

| Test | Assertion |
|------|-----------|
| empty selection | `selectionHomeHref()` → `/#solutions` |
| state + step | full serialized query + `#solutions` |
| legacy query | query preserved on `/` with hash |
| empty legacy query | `/#solutions` |

---

## Concerns

None. Helpers are pure string builders with no side effects. `urlState.ts` left untouched per brief.

---

## Next Task Dependencies

Task 2+ can import:

```ts
import { selectionHomeHref, selectionLegacyToHomePath } from "@/lib/selection/homeHref";
```

For redirect middleware or link updates from `/selection` routes.
