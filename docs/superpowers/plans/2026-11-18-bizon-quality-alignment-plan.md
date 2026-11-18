# Bizon quality and CMS alignment — execution plan

**Date:** 18 November 2026
**Status:** in progress; public-site and CMS media E2E are green in isolated/local environments; backend fixes and the stale-test correction are integrated in the active backend and verified; main local DB is current at 202611180040; clean-machine E2E bootstrap and full entity/API inventory remain open
**Design/spec:** docs/superpowers/specs/2026-11-18-bizon-quality-alignment-design.md

## Operating constraints

- Follow root AGENTS.md and nested frontend-cms/AGENTS.md and backend-app/AGENTS.md.
- Preserve the current user worktree in all three repositories. Do not switch/reset/clean user changes to manufacture a green baseline.
- Do not run production writes, migrations, external uploads, or deploys.
- Do not delete or skip tests to obtain a green run.
- Before any test that writes data, verify the target is disposable and isolated.
- For each task, record exact commands, repository, branch, environment, result, and remaining limitation.

## Phase 0 — project rules and plan baseline

**Status: completed in this planning phase.**

Deliverables:

- Project-wide operating rules appended to root AGENTS.md.
- CMS-specific rules in frontend-cms/AGENTS.md.
- Backend-specific rules in backend-app/AGENTS.md.
- Design and this execution plan written under docs/superpowers.

Acceptance:

- Rules preserve the existing CSS requirements.
- Rules explicitly cover test triage, safe data, evidence, contracts, agent delegation, and completion reporting.
- Nested repository agents are directed to read the root rules.

## Phase 1 — preserve and reproduce the baseline

**Goal:** establish which observed results are reproducible in the current checkout without confusing them with pre-existing changes.

**Execution update (18 November 2026):**

- Recorded current branches and working-tree state before rerunning suites; preserved pre-existing edits in the public site and untracked user artifacts in all three repositories.
- Fresh root `npm test`: FAIL, 118 files (113 passed, 5 failed), 471 tests (463 passed, 8 failed). Five failure files match the audit baseline.
- Fresh `frontend-cms`: `npm test` PASS (49 files, 230 tests); `npm run lint` PASS with 25 warnings; `npm run typecheck` PASS.
- Fresh `backend-app`: `npm test` PASS (81 files, 399 tests); `npm run typecheck` PASS.
- Fresh root `npm run lint`: PASS, 0 errors and 16 warnings.
- Fresh root `npm run typecheck`: FAIL, 2 diagnostics in `src/components/cart/CartPage.test.tsx` and `src/components/forms/ContactRequest.test.tsx`; both are `createElement` calls whose props omit a required `children` property even though children are supplied as the third argument. This is a test typing/React overload issue pending confirmation and correction.
- Original audit public Playwright result: 256 invocations (115 passed, 48 failed, 93 skipped), 24 unique failing scenarios; that run stalled during finalization after scenario execution. The clean-worktree rerun and current result are recorded below.
- At this historical baseline, CMS media E2E was BLOCKED at database-schema readiness because Docker was unavailable. No DB bootstrap, migration, or external writes were attempted in that run.
- Initial local diagnosis: failures in `MainHero`, `BrandingCampaign`, and `HomeSections` use text collectors that only recurse through `props.children`, while the configured Bizon JSX runtime wraps string children in `BizonText({ value })`. This is a confirmed test-observer blind spot; verify via a DOM/render-based assertion before changing tests. `SiteFooter` expects a raw HTML substring despite semantic nested markup; its intended visible/accessibility label and link route are present in the component source. `styleTokens` currently rejects `letter-spacing: inherit`, although that declaration inherits rather than hardcodes a numeric token; confirm the approved token policy before changing either test or CSS.
- At the time the baseline was first recorded, no product code or test file had been changed. Subsequent isolated changes and verification are recorded below.

**Isolated root-repository follow-up (clean `HEAD` worktree):**

- Baseline on clean commit `0a302379b66c7312cb534493d76498727a355e9a` reproduced the same 8 unit assertion failures and 2 typecheck diagnostics as the active checkout. This rules out the active uncommitted JSX runtime change as their cause.
- Corrected five public-site test files so the text observer recognizes `BizonText`, footer assertions use visible text plus route, and token checks allow semantic inheritance. Updated two `createElement` tests to JSX so required `children` typecheck without `react/no-children-prop` lint errors.
- Fixed a product defect in `WheelModelGrid`: reset links previously changed the route but left the mounted component's filter state intact. Both desktop and mobile reset actions now clear local state.
- Updated E2E selectors/contracts for the current custom size combobox, current footer label/routes, and current non-accordion mobile footer structure.
- Full root regression after these changes: `npm test` PASS, 118 files / 471 tests; `npm run typecheck` PASS; `npm run lint` PASS with the same 16 warnings.
- Final full public Playwright in the clean worktree: 256 invocations, 128 passed, 32 failed, 96 skipped; 20 unique failed scenarios. It exited normally in 10.3 minutes. This is local static CI-fixture coverage, not live backend/production validation.
- The 16 targeted regression E2E invocations for wheel reset, tire catalog size selection, and main/Shop footers pass across all four viewport profiles.
- At this intermediate checkpoint, CMS media E2E remained BLOCKED. The later isolated DB-backed run and its results are recorded in Phase 4/5 below.

**Final public-site regression update (18 Nov 2026):**

- After the prior triage run (128 pass / 32 fail / 96 skipped), the remaining failures were classified and corrected in tests or owning product modules.
- Latest full Playwright run: 256 invocations, 157 passed, 0 failed, 99 skipped; completed normally in about 3 minutes on the static local CI fixture.
- The only remaining skip classes are project/profile guards and API-dependent scenarios gated by the test environment. Three drawer tests are intentionally skipped in the mobile-only profile because that shell navigates through the bottom bar; dedicated mobile request navigation is tested.
- Latest root `npm test`: 118 files / 471 tests PASS. `npm run typecheck` PASS. `npm run lint` PASS, 0 errors / 16 warnings. `npm run build:ci` PASS, 39 static routes.
- Targeted follow-up: mobile regression 11 passed / 3 profile skips; desktop drawer/navigation regression 7/7 passed.
- Confirmed product fixes: wheel filter reset clears mounted local state; long Russian hero headings wrap without horizontal overflow. No scroll-lock product change was retained: prior scroll-loss assertions came from Playwright auto-scrolling to an offscreen trigger before opening the drawer.
- Test-contract updates now match the current custom combobox, `BizonText` runtime, accessible footer text/routes, current mobile bottom navigation, current technical-parameter cards, fixture content, and `LoopedStrip`'s single active grid slot.
- At that intermediate checkpoint, CMS media E2E and `typecheck:e2e` were blocked by unavailable Docker and missing sibling source. The later run used isolated DB/storage and temporary sibling source copies; see the latest execution update and remaining reproducibility gates.

Tasks:

1. Record branches and status for root, frontend-cms, and backend-app before running checks. Keep all existing changes intact.
2. Capture the current audited outcomes as baseline. Do not describe the old numbers as a fresh result if the commands are not rerun.
3. Rerun each test suite independently and save output/artifacts:
   - root: npm test;
   - frontend-cms: npm test, npm run lint, npm run typecheck;
   - backend-app: npm test, npm run typecheck;
   - root public build/E2E only after checking the build target and generated-output handling.
4. If a clean committed baseline is needed to isolate user modifications, use a separate temporary worktree or a file-level comparison. Never reset the active working copy.
5. Preserve Playwright traces and failure context. Fix the current E2E finalization/reporting problem so the next run prints a complete summary.

Acceptance:

- The report distinguishes verified current results from previous-run evidence.
- The total count, pass/fail/skip arithmetic is consistent.
- No user changes are overwritten or included accidentally.

## Phase 2 — build a test and contract inventory

**Goal:** know what each test actually promises before retiring or rewriting anything.

**Progress:** public-site unit/type/lint/build baseline is green in the isolated worktree; full public E2E is 157/0/99. CMS media E2E passes 8/8 against a disposable restored PostgreSQL copy and local MinIO. Backend is 81 files/399 passing after correction of one stale migration-order assertion. A top-level section-to-operation-to-test map is now in the audit; full CMS/backend entity-to-table-to-public-reader inventory remains open. No tests were deleted; profile skips are explicit and conditional.

For each package, inventory test files and commands. Record:

| Field | Required value |
|---|---|
| Test name/file | Stable identifier and owning package |
| Level | Unit, component/UI, API/contract, integration, E2E, visual |
| Behavior | User or system contract asserted |
| Dependency | Mock, fixture, database, storage, external service |
| Data safety | Read-only or exact isolated write target |
| Last result | PASS, FAIL, BLOCKED, NOT RUN with date/run |
| Maintenance decision | Keep, repair assertion, update fixture, make deterministic, replace, or retire with evidence |

Build a parallel entity/API inventory for pages, tires, wheels, Shop, materials, media, publication/change sets, users, and requests. Trace their CMS writer, backend operation, tables, permissions, published reader, and public consumer.

Acceptance:

- Every failing or skipped test has an owner and an understood assertion.
- Every CMS entity shown in the admin has its writer/read path and publication semantics documented.
- Unknown contracts are explicitly listed for product decision; implementation is not used as the only source of intent.

## Phase 3 — triage observed test failures

**Goal:** separate real defects from stale expectations, fixtures, and harness failures.

### Public-site unit failures: 8 assertions in 5 files

1. styleTokens: investigate the detected letter-spacing declaration against the design-token rule. Decide whether CSS or test policy is authoritative.
2. SiteFooter: replace raw serialized-HTML substring expectation with an accessible DOM/text assertion only after confirming the intended label and route.
3. BrandingCampaign and HomeSections: validate test props/fixtures against current CMS content contracts.
4. MainHero: investigate the text collector and current user-owned JSX runtime diff. Compare the changed checkout with committed source without overwriting the active tree.

### Public Playwright failures: 48 failed runs, 24 unique scenarios

First triage the eight assertions that repeat across all four viewport projects:

- custom combobox test uses an HTML-select action;
- footer label and route expectations differ from current rendered links;
- supplier-proof copy is missing from the build fixture or page;
- Shop hero background assertion fails;
- forged-wheel filter returns zero where the test expects two;
- branding CTA target heading is not found;
- long Russian heading overflows its expected track.

Then triage the 16 profile-specific failures: cart/drawer scroll and timeout behavior, duplicated CTA locators, mobile filter/selector expectations, disclosure behavior, focus geometry, and desktop navigation assertions.

For each scenario:

1. Inspect the Playwright trace and error context.
2. Compare assertion, current accessibility tree/DOM, route, viewport, and fixture.
3. Confirm the product contract.
4. Classify as product defect, test drift, fixture drift, flake, environment issue, unknown, or proven obsolete.
5. Repair the test or product at its owning layer and add/retain regression coverage.

Acceptance:

- No failing assertion is deleted or skipped merely because it is inconvenient.
- Each test has a decision and evidence.
- Product defects are distinguished from tests that encode an old contract.
- Profile-only tests are not counted as independent product bugs when they repeat the same root cause.

## Phase 4 — unblock the isolated CMS E2E harness

**Priority: P1. First local proof is complete; clean-machine repeatability remains open.**

Current evidence: a disposable local PostgreSQL database was restored from an explicitly named E2E dump, schema readiness was verified, and a dedicated local MinIO bucket was used. The safety preflight passed and all eight CMS media E2E scenarios completed. The dump and local credentials are untracked, so clean-machine bootstrap is not yet reproducible from committed project files.

Tasks:

1. Document the canonical baseline schema provisioning method for disposable E2E PostgreSQL. Establish a restored test copy or deterministic baseline migration/seed process.
2. Start only local test PostgreSQL and local S3-compatible storage with separate E2E identities.
3. Verify DB identity, E2E name, expected core tables, migration ledger, S3 endpoint and bucket, test account, CMS/backend URLs, and network isolation before app startup.
4. Make setup idempotent and ensure cleanup/restore works after interruption.
5. Fix failure reporting so readiness errors identify the missing prerequisite without exposing secrets.
6. **Complete:** run the existing CMS media E2E. It completed 8/8 after selectors and save synchronization were aligned with the current UI contract.

Acceptance:

- A clean documented setup works without production credentials. **Open:** document and verify repeatable provisioning of the named E2E baseline on a clean machine.
- Preflight fails closed on wrong host/database/bucket or missing schema.
- Test data and uploaded objects are removed or restored after pass and failure.
- The full browser scenario reaches the assertions rather than stopping at startup.

The completed run confirmed that tire publication required explicit PostgreSQL enum casts (SQLSTATE `42P08`), wheel variant availability must come from each variant, and homepage media E2E must wait for the save action's status/response rather than a persistent helper message. Backend fixes and the migration-test correction are now in the active backend checkout and pass E2E/Vitest/typecheck. The migration test had incorrectly assumed migration 0039 would remain the last registered migration after migration 0040 was added. The active local database `bizon` was rechecked: migration runner reports `202611180040`, and the migration ledger plus migration-0040 column are present, so no schema migration was pending.

## Phase 5 — prove critical vertical slices

After the harness is ready, implement and verify one critical path at a time. Do not build a large generic E2E suite before the first vertical slice is stable.

Recommended order:

1. **Auth and permissions:** missing/invalid/expired session, logout, allowed and denied capabilities at the backend and visible UI.
2. **Page editing:** load → validate → save → reload/read-back → publish → public API/snapshot → static page.
3. **Catalog entity editing:** one representative tires flow and one Shop or wheels flow, then extend the same contract to other entity types.
4. **Media:** invalid file rejection, valid upload byte integrity, selection from gallery, usage/reference persistence, replacement/deletion safety, public rendering.
5. **Failure recovery:** backend error, conflict, unavailable S3/deploy service, retry/idempotency, retained editor input, accurate user-facing status.

Use API/integration tests for data/permission behavior and E2E only for the key browser journey. The public site’s root E2E fixture and the CMS DB-backed E2E fixture must have named, separately understood roles.

Acceptance:

- Each critical slice proves durable state, not only optimistic UI state.
- Published revision and public content correspond to the saved test record.
- External-service failure is safe and observable.

## Phase 6 — contract alignment and controlled simplification

Only after phases 2–5 establish current behavior:

1. Choose canonical ownership for shared labels, status rules, permission policy, and API types.
2. Add cross-package contract/parity tests where separate repositories cannot import one shared package.
3. Remove duplicate code only where behavior is identical and ownership is agreed; avoid broad mechanical consolidation.
4. Retire dead modules/tests only after reference search, runtime/test reachability checks, documented obsolete behavior, and replacement coverage.
5. Simplify the CMS/backend/public flow where a proven redundant boundary exists. Preserve deliberate boundaries such as backend-only database access and publication revision checks.
6. Document migration/backfill/rollback or recovery requirements before schema changes.

Acceptance:

- Every removed item has evidence it is unreachable/redundant and the replacement test is passing.
- No public/admin contract is accidentally removed because it looked duplicated.
- Simplification reduces owners/branches without weakening required behavior.

## Phase 7 — release gates and ongoing maintenance

For each change:

1. Focused test on the changed rule.
2. Package regression suite.
3. Cross-app contract/integration test if a boundary changed.
4. Critical E2E journey in isolated local environment.
5. CI verification.
6. Staging smoke and revision check when deployment/configuration changes.
7. Production read-only verification only when separately authorized and safely scoped.

Maintain a small dashboard or release note showing:

- passing/failing/blocked/not-run checks by package and level;
- unique failing scenarios, not raw viewport invocation totals alone;
- skip reasons and expiry/restore conditions;
- harness health and prerequisites;
- critical journey coverage;
- known risks and changes needed to remove each blocker.

## Priority and dependency summary

| Priority | Work | Depends on |
|---|---|---|
| P0 | Preserve worktree; install project-wide and nested agent rules | Complete |
| P1 | Reproduce current baseline and fix reporting/finalization visibility | P0 |
| P1 | Test/contract inventory and failure classification | P0, current test artifacts |
| P1 | Disposable DB baseline and local storage harness | Environment owner and documented schema baseline |
| P1 | Auth, page save/reload/publish/public-read vertical slice | Harness, page contract |
| P1 | Media lifecycle and revision consistency | Harness, asset/publication contracts |
| P2 | Resolve public test/fixture drift and viewport-specific UI findings | Failure classification |
| P2 | Consolidate duplication and retire proven dead tests/code | Inventory and passing replacement coverage |
| P2 | Staging/release gates and ongoing test-health reporting | Stable local and CI baselines |

## Stop conditions

Pause an individual write/integration test if its database, bucket, credentials, or external destination cannot be proven isolated. Mark it BLOCKED and define the missing prerequisite. Do not bypass the guard to obtain a green run.

Do not remove or suppress a failing test until its contract has been reviewed and its status has an evidence-backed decision. Do not begin broad refactoring while a critical data-flow boundary is still unknown.

## Remaining execution gates

1. Keep the public-site fixes in the isolated worktree until a diff review and integration decision. Do not mix them into the active uncommitted Tire IQ work.
2. Preserve the multi-repository test composition required by `typecheck:e2e`; the latest run used temporary sibling source copies in the isolated worktree and passed typecheck. Make that composition repeatable for a fresh worktree.
3. Document and verify clean-machine provisioning of the disposable Bizon PostgreSQL baseline and local object storage. Current E2E used an untracked test dump/config and must not rely on user-local state implicitly.
4. Extend the DB-backed matrix beyond currently covered representative entities and media: denied/allowed permissions, conflicts, retries, recovery after S3/API errors, and remaining page/entity contracts.
5. Complete the CMS/backend entity-to-operation-to-table-to-public-reader inventory. Only then decide whether any module or test is obsolete and whether replacement coverage exists.

No production, staging, external storage, or shared database writes were performed. No test was deleted. These gates are required before declaring the overall CMS quality alignment program complete.

## Final acceptance for the alignment program

- Root and nested agent rules are present and discoverable.
- Current CMS structure and entity/API/data contracts are mapped.
- No unexplained failure, permanent skip, or flaky test remains in the agreed maintained baseline.
- Disposable CMS integration/E2E setup is documented and repeatable.
- Auth, edit/save/reload, publish/revision/public-read, and media critical paths have relevant passing evidence.
- Simplifications are tied to dependency/reference proof and replacement tests.
- Each Git repository has a reviewable diff and independent verification report.
- Staging/production claims are only made when those environments were actually checked.
