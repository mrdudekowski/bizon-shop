# CSS Layout & Responsive Design Rules for Codex AI

## **CRITICAL: CSS Grid Best Practices**

### 1. Always Define `grid-template-columns` Explicitly
**Rule:** Never use `display: grid` without explicit `grid-template-columns` for containers with overflow or intrinsic-sized children.

**Why:** Implicit `auto` sizing calculates column width as `max-content` of children, causing overflow.

**Implementation:**
```css
/* ❌ AVOID - causes overflow */
.container {
  display: grid;
  gap: 20px;
}

/* ✅ REQUIRED */
.container {
  display: grid;
  grid-template-columns: minmax(0, 1fr); /* Forces column to respect container width */
  gap: 20px;
}
```

**When to use:**
- Any Grid container with children that have `overflow: auto/scroll`
- Any Grid container with nested Grids/Flex
- Any Grid container in responsive layouts

---

### 2. Add `min-width: 0` to Grid/Flex Items with Overflow Children
**Rule:** Always add `min-width: 0` (or `min-height: 0` for vertical) to Grid/Flex items that contain elements with `overflow: auto/scroll`.

**Why:** Grid/Flex items have implicit `min-width: auto`, preventing shrink below intrinsic content size, breaking overflow behavior.

**Implementation:**
```css
/* ✅ REQUIRED PATTERN */
.grid-item {
  width: 100%;
  min-width: 0; /* Allows item to shrink below intrinsic size */
}

.grid-item-child {
  overflow-x: auto;
  min-width: 0; /* Also needed for nested grids */
}
```

**When to use:**
- Grid/Flex items containing scrollable content
- Nested Grid/Flex containers
- Any element with `overflow-x: auto` or `overflow-y: auto`

---

### 3. Combine `width: 100%` with `max-width: 100%`
**Rule:** Always pair `width: 100%` with `max-width: 100%` for elements that must not overflow their parent.

**Why:** In Grid/Flex context, `width: 100%` resolves relative to track/container size, not visual parent, potentially causing overflow.

**Implementation:**
```css
/* ❌ AVOID - can overflow */
.element {
  width: 100%;
}

/* ✅ REQUIRED */
.element {
  width: 100%;
  max-width: 100%; /* Hard constraint - prevents overflow */
  min-width: 0;    /* Allows shrink if needed */
}
```

**When to use:**
- All Grid items in responsive layouts
- All elements with percentage widths in Grid/Flex
- Carousels, galleries, scrollable containers

---

## **RESPONSIVE LAYOUT ARCHITECTURE**

### 4. Establish Sizing Constraints at Every Level
**Rule:** Set explicit sizing constraints (`max-width`, `min-width`) at every nesting level, not just media queries.

**Why:** Prevents intrinsic sizing from propagating up the layout tree and causing unexpected overflow.

**Implementation:**
```css
/* ✅ LAYERED CONSTRAINTS */

/* Level 1: Container */
.section {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr); /* Explicit constraint */
}

/* Level 2: Grid item */
.carousel {
  width: 100%;
  max-width: 100%;  /* Respects parent */
  min-width: 0;     /* Allows shrink */
}

/* Level 3: Overflow container */
.carousel-track {
  overflow-x: auto;
  min-width: 0;     /* Critical for overflow */
}

/* Level 4: Media queries for adaptivity */
@media (min-width: 640px) {
  .carousel-track {
    grid-auto-columns: calc((100% - 16px) / 2);
  }
}
```

---

### 5. Mobile-First Responsive Design
**Rule:** Start with mobile constraints in base styles, expand through media queries for larger screens.

**Implementation:**
```css
/* Base: Mobile (< 640px) */
.element {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 20px;
}

/* Tablet (≥ 640px) */
@media (min-width: 640px) {
  .element {
    padding: 40px;
  }
}

/* Desktop (≥ 1024px) */
@media (min-width: 1024px) {
  .element {
    max-width: 1200px;
  }
}
```

---

## **DEBUGGING GUIDELINES**

### 6. DevTools Diagnostic Checklist
**Rule:** When debugging layout issues, always run these diagnostics in browser console.

**Implementation:**
```javascript
// 1. Viewport validation
console.log({
  innerWidth: window.innerWidth,
  clientWidth: document.documentElement.clientWidth
});

// 2. Media query validation
console.log({
  mobile: window.matchMedia('(max-width: 639px)').matches,
  tablet: window.matchMedia('(min-width: 640px)').matches
});

// 3. Grid container validation
const grid = document.querySelector('.grid-container');
console.log({
  display: getComputedStyle(grid).display,
  gridTemplateColumns: getComputedStyle(grid).gridTemplateColumns,
  width: getComputedStyle(grid).width
});

// 4. Grid item validation
const item = document.querySelector('.grid-item');
console.log({
  width: getComputedStyle(item).width,
  minWidth: getComputedStyle(item).minWidth,
  maxWidth: getComputedStyle(item).maxWidth,
  offsetWidth: item.offsetWidth,
  parentWidth: item.parentElement.offsetWidth
});
```

**Expected Results:**
- `innerWidth` should match expected viewport (e.g., 390 for iPhone 12 Pro)
- `gridTemplateColumns` should NOT be 'none' or larger than container width
- `offsetWidth` of items should NOT exceed parent `offsetWidth`

---

## **BOX MODEL ESSENTIALS**

### 7. CSS Box Model Application Order
**Rule:** Understand CSS property application order for correct constraint setting.

**Order:**
```
1. Grid/Flex track sizing (grid-template-columns, flex-basis)
2. min-width / min-height (can expand element)
3. width / height (base size)
4. max-width / max-height (OVERRIDES width/height if smaller)
5. padding (included if box-sizing: border-box)
6. border
```

**Best Practice Pattern:**
```css
.element {
  /* Allow shrink */
  min-width: 0;
  
  /* Base size */
  width: 100%;
  
  /* Hard limit (OVERRIDES width if needed) */
  max-width: 100%;
  
  /* Include padding in width calculation */
  box-sizing: border-box;
}
```

---

## **COMMON PATTERNS**

### Pattern 1: Horizontal Scrollable Container (Carousel)
```css
/* Container */
.carousel-container {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  position: relative;
}

/* Scrollable track */
.carousel-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 100%; /* Mobile: 1 card */
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  min-width: 0; /* Critical */
  
  /* Hide scrollbar */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.carousel-track::-webkit-scrollbar {
  display: none;
}

/* Responsive columns */
@media (min-width: 640px) {
  .carousel-track {
    grid-auto-columns: calc((100% - 16px) / 2); /* 2 cards */
  }
}
```

### Pattern 2: Grid Container with Variable Content
```css
.grid-container {
  display: grid;
  grid-template-columns: minmax(0, 1fr); /* Explicit sizing */
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.grid-item {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}
```

### Pattern 3: Nested Grid with Overflow
```css
.outer-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.outer-grid-item {
  min-width: 0; /* Critical for nested grids */
}

.inner-grid {
  display: grid;
  overflow-x: auto;
  min-width: 0; /* Critical */
}
```

---

## **CHECKLIST FOR NEW COMPONENTS**

When creating new layout components, verify:

- [ ] All Grid containers have explicit `grid-template-columns` (not relying on implicit 'auto')
- [ ] All Grid/Flex items with overflow children have `min-width: 0` (or `min-height: 0`)
- [ ] All elements with `width: 100%` also have `max-width: 100%`
- [ ] Mobile-first approach: base styles for smallest screen, media queries for expansion
- [ ] Tested in DevTools with actual device dimensions (not just browser resize)
- [ ] Ran diagnostic console checks to verify computed styles match expectations

---

## **WHEN TO APPLY THESE RULES**

**Always apply when:**
- Using `display: grid` or `display: flex`
- Creating scrollable/overflow containers
- Building responsive layouts
- Nesting Grid/Flex containers
- Working with percentage widths

**Critical for:**
- Carousels and galleries
- Horizontal scrollable lists
- Sidebar layouts
- Modal/drawer components
- Any component with `overflow: auto/scroll`

---

## **REFERENCE: ROOT CAUSE OF COMMON OVERFLOW ISSUES**

**Issue:** Element overflows parent container despite `width: 100%`

**Root Causes (in order of frequency):**
1. **Missing `grid-template-columns`** on Grid container (implicit 'auto' uses max-content)
2. **Missing `min-width: 0`** on Grid/Flex item (can't shrink below intrinsic size)
3. **Missing `max-width: 100%`** on element (no hard constraint)
4. **Intrinsic sizing propagation** from nested overflow containers

**Solution Pattern:**
```css
/* Parent Grid */
.parent {
  display: grid;
  grid-template-columns: minmax(0, 1fr); /* Fix #1 */
}

/* Child Grid item */
.child {
  width: 100%;
  max-width: 100%;  /* Fix #3 */
  min-width: 0;     /* Fix #2 */
}

/* Nested overflow */
.nested {
  overflow-x: auto;
  min-width: 0;     /* Fix #4 */
}
```

---

## **AI ASSISTANT INSTRUCTIONS**

When generating or modifying CSS for layout components:

1. **ALWAYS check** if parent is `display: grid` or `display: flex`
2. **ALWAYS add** `grid-template-columns: minmax(0, 1fr)` to Grid containers (unless specific column layout needed)
3. **ALWAYS add** `min-width: 0` to Grid/Flex items with overflow children
4. **ALWAYS pair** `width: 100%` with `max-width: 100%`
5. **ALWAYS start** with mobile constraints, expand via media queries
6. **NEVER assume** DevTools emulation is accurate without console validation
7. **ALWAYS run** diagnostic checks after implementing responsive layouts

**Red Flags (require immediate attention):**
- `display: grid` without `grid-template-columns`
- `overflow: auto` without `min-width: 0` on parent
- `width: 100%` without `max-width: 100%` in Grid/Flex
- Percentage widths in nested Grid/Flex without constraints
- Computed width > parent width in DevTools

---

**Last Updated:** 2024-01-27  
**Source:** Diagnostic analysis of carousel overflow issue in bizon_tires project  
**Status:** Active - enforce in all CSS development

---

# Project-wide engineering and AI-agent workflow

These rules apply to the public site in the repository root, frontend-cms, backend-app, their tests, and documentation. Read these rules before work in any of the three Git repositories. Preserve the existing CSS requirements above.

## 1. Establish the current state before acting

- Identify the target application, its package scripts, data boundaries, and relevant project instructions before changing files.
- Inspect branch and working-tree status in every affected Git repository. Treat pre-existing modified, staged, and untracked files as user-owned. Do not overwrite, reset, clean, or include them in a change unless explicitly asked.
- Read the owning implementation and tests. Historical plans, audit notes, commit messages, and agent summaries are context, not proof of current behavior.
- State the scope, expected behavior, allowed files/systems, and verification criteria before implementation. If the user requested investigation only, do not make product changes.

## 2. Trace behavior across system boundaries

For behavior that crosses applications, trace the same entity and value through the actual path:

~~~text
CMS/browser → API contract → backend authorization/business logic
→ database or object storage → published read/snapshot
→ public build/runtime → visitor-visible result
~~~

- Identify the source of truth for drafts, saved state, published state, and generated output separately.
- Do not treat a CMS success message, HTTP 200, passing unit test, successful build, or deploy request as proof that the final public result is correct.
- For CMS work, verify both access control and the backend operation. Hiding a button is not authorization.
- Preserve explicit boundaries: PostgreSQL is accessed by backend-app; browser clients call the intended API; media bytes and media metadata have separate storage responsibilities; published reads must use the published contract.
- Do not duplicate business rules, formatters, permission decisions, or data mappings across applications without a documented reason and a parity test.

## 3. Use evidence and label uncertainty

Classify conclusions as:

- **Confirmed:** supported by a current test, trace, request/response, database/API read, or source behavior.
- **Hypothesis:** plausible explanation awaiting a discriminating check.
- **Requirement decision:** expected product behavior that must be taken from an agreed contract, not inferred from the current implementation.
- **Blocked / not run:** the environment, credentials, schema, or safe test data was unavailable.

For bugs, record the user steps, expected and actual result, first layer where values diverge, and a reproducible command or trace when available. Never describe a blocked or unrun check as passing.

## 4. Treat failing tests as evidence to classify, not as cleanup targets

- Never delete, disable, skip, weaken, or rewrite a failing test solely to make the suite green.
- Classify each failure before changing product or test code: product defect, stale assertion/selector, fixture or contract mismatch, test harness/environment failure, flaky test, or duplicate coverage.
- Confirm the intended behavior before deciding whether the implementation or assertion is wrong.
- A test can be removed only after proving its contract is obsolete or fully covered elsewhere; document the evidence and replacement coverage.
- Every skip needs a named reason, a scope (for example, a required disposable API), and a condition for restoring coverage. Do not accept silent permanent skips.
- Prefer behavior and accessibility assertions over source-text matching, brittle markup snapshots, and selectors tied to implementation details.
- A regression test should fail on the original defect, pass after the fix, and protect the user-visible contract.

## 5. Test at the smallest useful level, then verify the critical path

- Use unit tests for isolated rules, component tests for UI states, API/contract tests for boundary formats and permissions, integration tests for real database/storage behavior, and E2E for critical user journeys.
- Do not use E2E as a substitute for fast lower-level tests. Do not claim an end-to-end result from unit or build checks.
- For each change, run the narrowest test that distinguishes the hypothesis, then relevant neighboring regressions and the agreed suite.
- When behavior crosses CMS, backend, database, media, deployment, or public site, include at least one test at the real boundary that could fail independently.
- Keep test names, assertions, fixtures, and their real coverage aligned. A test count is not a coverage argument.

## 6. Protect data and external systems

- Use disposable test databases and isolated local object-storage buckets for write, publish, upload, replacement, and deletion tests.
- Before any test that writes data, verify the database identity, schema readiness, storage endpoint, bucket, and test account. Fail closed if any check is uncertain.
- Never point test or seed commands at production. Do not run migrations against shared, staging, or production data unless the task explicitly authorizes that exact action.
- Keep external credentials on the backend. Tests should block external HTTP requests unless a named, controlled test dependency is explicitly required.
- Make cleanup reliable after success and failure. Prefer unique test records and idempotent setup/cleanup.
- Model external calls with clear timeout, retry, idempotency, and failure behavior. A user-facing success should correspond to a durable system state.

## 7. Keep API, data, and migration contracts compatible

- For changes to an entity, enumerate its readers and writers, status transitions, permissions, relations, and public representation.
- Validate inputs at the server boundary; client-side validation is helpful UX, not data protection.
- Keep database migrations additive and compatible with the rollout sequence where practical. Document prerequisites, backfill, readiness, and recovery.
- Do not assume an empty Docker PostgreSQL database contains the Bizon baseline schema. Verify the documented baseline before migrations or integration tests.
- Keep publication atomic where the product contract requires it. Verify rollback/partial failure behavior and the revision returned to the public site.

## 8. Build a safe test harness for integration and E2E

A reliable harness must define the application processes, disposable dependencies, baseline schema/seed data, credentials, ports, readiness checks, external-network fences, test records, cleanup, and useful failure artifacts. The harness must be reproducible from documented commands on a clean machine.

For CMS E2E, cover the critical vertical path: authenticate → check permissions → edit/save → reload and read back → publish → verify published API/revision → verify public output. Add media storage checks when the scenario changes media.

Mocks and fixtures are useful, but they must match the current API contract. Keep at least one integration check for critical boundaries that mocks cannot prove. Label what a fixture build does and does not prove.

## 9. Debug systematically; do not guess at the first matching file

1. Reproduce the smallest failing user scenario.
2. Capture inputs, environment, request IDs, logs, and current data.
3. Follow one value through each boundary and find the first divergence.
4. State one hypothesis and the observation that would disprove it.
5. Add or run a focused test that distinguishes that hypothesis.
6. Make the smallest change at the confirmed owning layer.
7. Run the focused test, relevant regressions, and the end-to-end path when available.
8. Report unresolved uncertainty rather than hiding it with retries or broad refactors.

For flaky tests, inspect trace and timing, remove shared mutable state, wait for specific observable conditions, and track recurrence. Retries may provide diagnostic signal but are not the fix.

## 10. Delegate agents through bounded, non-overlapping tasks

- Give each agent a named question or deliverable, relevant files and boundaries, allowed actions, acceptance criteria, and required evidence.
- Use read-only investigation first when the root cause or contract is uncertain.
- Parallelize independent investigations or file areas. Do not assign concurrent edits to the same component, migration, fixture, or test data.
- Name one owner to reconcile findings, decide the contract, integrate changes, and inspect every diff.
- Agent completion reports must include files changed, commands run, exact results, environment, limitations, and remaining risks. Do not rely on a claim such as “looks good.”

## 11. Definition of done

A change is ready for review when:

- The requirement and acceptance criteria are unambiguous.
- The root cause or design decision is supported by evidence.
- The diff is limited to the approved scope and preserves unrelated work.
- Tests cover the changed behavior and relevant neighboring contracts.
- Commands and results are recorded as PASS, FAIL, BLOCKED, or NOT RUN, with environment and reasons.
- Data, migration, security, accessibility, responsive behavior, and external-service risks were considered where relevant.
- User-visible flows were checked at the appropriate test level.
- Documentation and remaining uncertainty are explicit.

Never use “all tests pass,” “fully verified,” or “production-ready” unless the exact scope and evidence support that statement.
