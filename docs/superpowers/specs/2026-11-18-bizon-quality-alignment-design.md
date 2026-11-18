# Bizon engineering quality and CMS alignment — specification

**Date:** 18 November 2026
**Status:** approved working direction; implementation and verification are in progress
**Evidence baseline:** local audit and test run documented in CMS_AUDIT_2026-11-18.md

## Purpose

Bring the public site, CMS, backend, database, media storage, publication pipeline, and their tests into an explicit, maintainable set of contracts. Establish project rules that every agent reads, then use a staged plan to determine what is correct, what is broken, what is obsolete, what is duplicated, and what is not yet verifiable.

The target is not a cosmetically green test run. The target is a system where maintained tests encode current behavior, cross-application data remains consistent, critical user journeys are reproducible, and test failures cannot silently disappear through skipping or deletion.

## System context

The project contains three applications and separate Git repositories:

1. Public site in the repository root. Next.js static export consumes published content at build time; some pages also refresh data at runtime.
2. frontend-cms. Browser-based editorial UI that uses the backend admin API.
3. backend-app. Owns PostgreSQL access, admin/public API, publication reads, media metadata and object-storage operations, request handling, and deployment integration.

Important boundaries include PostgreSQL, S3-compatible storage, admin and public API contracts, static snapshots/revisions, and the external deployment provider. A CMS success response, a passing unit test, and a successful static build each prove different things.

## Current evidence baseline

The audit on 18 November 2026 established:

| Check | Observed result |
|---|---|
| CMS unit/UI suite | 49 files, 230 passed |
| Backend unit suite | 81 files, 399 passed |
| Public-site unit suite | 118 files, 471 total: 463 passed and 8 failed in 5 files |
| Public static build with local API fixture | Passed; 39 generated routes; compile, lint and type validation completed |
| Public Playwright suite | 256 runs: 115 passed, 48 failed, 93 skipped |
| CMS media E2E | Later verified locally: 8/8 pass on isolated restored DB + local object storage; clean-machine bootstrap still open |
| CMS lint/typecheck | Lint: 0 errors and 25 warnings; typecheck passed |
| Backend typecheck | Passed |

The public Playwright process completed scenario execution but stalled while finalizing and was interrupted. The 48 failed runs were recovered from failure artifacts; skip totals were reconciled with the configured skip conditions. Eight failure signatures repeated across all four viewport profiles; 16 more occurred only in individual profiles. This is not 48 independent product defects.

The user's statement about roughly 468 failures is not supported by this recorded run. The public-site unit suite had 8 failures and 463 passes; the public E2E had 48 failed invocations across 24 unique failing scenarios, plus passing and explicitly skipped runs.

The local worktree contained pre-existing user changes during the audit. Those changes were preserved. Any follow-up must distinguish failures caused by the current checkout, its uncommitted changes, stale tests, mismatched fixtures, and environment limitations.

### Latest local CMS execution update

After Docker became available, the CMS media suite passed 8/8 on a disposable restored PostgreSQL E2E database and dedicated local MinIO bucket. The flow covered auth, invalid/valid media upload, selection, save/read-back, publication, public snapshot/API, local static build, revision and byte-hash checks, and state cleanup. `typecheck:e2e` and backend typecheck passed; backend Vitest passed 81 files/399 tests after fixing one stale migration registration-order assertion. The test harness used temporary sibling source copies in the isolated worktree and an untracked local DB dump/config; clean-machine bootstrap is still an open requirement.

Two backend defects were confirmed and fixed in the active backend checkout: enum-typed status parameters in tire publication required explicit PostgreSQL casts (SQLSTATE `42P08`), and wheel variant availability had been copied from the model-level flag instead of the variant. A homepage media test initially read too early because it matched a persistent helper message; it now awaits the save response/status and the direct API read. That was test synchronization drift, not a product defect. No tests were deleted.

The main local DB was verified through the backend `.env` target (`127.0.0.1:5433`, database `bizon`). The migration runner confirms schema `202611180040`; the ledger, migration-0040 article image-alt column, and both enum types used by publication exist. No schema change was pending.

## Confirmed architecture and functional areas

The CMS includes tires and directions, wheels, Shop categories/subcategories/products, pages, materials, media, publications/change sets, users, and requests. Data flows through the backend admin API to PostgreSQL; media also crosses the S3-compatible storage boundary. Published data flows through public API/snapshot and the static build/revision/deployment process.

The CMS has a broad unit/UI suite, and a representative critical browser journey from login through save, reload, publish, public snapshot, and static media output is now demonstrated locally. This does not prove deployment-provider, staging, or production behavior. The harness has safety checks for loopback database/storage and test naming; its DB baseline and multi-repository test workspace still need a clean-machine provisioning procedure.

## Failure triage policy

Every failure and skip must be assigned to one evidence-backed category before repair:

1. Product defect.
2. Test assertion/selector drift from the approved product contract.
3. Fixture or test-data drift.
4. Harness, environment, schema, or dependency blocker.
5. Flaky/non-deterministic test.
6. Duplicate or obsolete test with proven replacement coverage.
7. Unknown pending a discriminating check.

No test is deleted, permanently skipped, or weakened solely because it fails. A test is retired only when its intended behavior is obsolete or covered by a stronger canonical test, with evidence recorded. A product contract is decided before changing a test expectation.

## Quality principles

- Record current worktree/branch state and preserve unrelated changes.
- Trace a user-visible value across each owner boundary.
- Separate facts, hypotheses, requirements, and blocked checks.
- Test at the smallest meaningful level, then cover critical integration paths.
- Keep tests isolated, repeatable, and representative of actual API contracts.
- Use a safe harness with disposable data, preflight, external-network fences, and cleanup.
- Keep database migrations compatible and explicit; never infer the target database.
- Use backend authorization, idempotency and transaction semantics as server-side guarantees.
- Keep one canonical owner for shared contracts/logic, or add a parity check where duplication is necessary.
- Use request IDs, revisions, and traces to follow failures across services.
- Make agent tasks bounded, evidence-based, and non-overlapping.
- Report PASS, FAIL, BLOCKED, and NOT RUN distinctly.

## Scope of the alignment program

### Included

- Durable project-wide and repository-specific agent rules.
- A current route/entity/API/data-flow inventory.
- A test inventory with ownership, level, dependencies, assertion contract, and last verified status.
- Triage and correction of the observed failing/blocked tests and stale fixtures.
- A reproducible isolated CMS E2E harness, including a documented database baseline/bootstrap.
- Critical vertical journeys for authentication/permissions, content CRUD and reload, media lifecycle, publication/revision, and public rendering.
- Contract consolidation, deduplication, and removal of dead code/tests only after proof.
- A staged verification and release gate across local, CI, staging, and production.

### Excluded from this planning phase

- Fixing product code, deleting tests, changing database content, or running migrations.
- Using production credentials, data, object storage, deployment services, or destructive actions.
- Broad refactoring before current contracts and owners are mapped.
- Treating all failures as product defects or all failing tests as obsolete.

## Definition of a trustworthy target state

- Every maintained test has a named behavior, owner, level, and safe data dependency.
- No unexplained test failure remains in the agreed CI baseline.
- Every skip has a documented, conditional reason and a plan to restore coverage.
- CMS E2E can start from documented prerequisites on an isolated, disposable DB and local object storage.
- Critical editorial journeys prove save/reload and publish/public-read, not merely an HTTP success.
- API/data/status/permission contracts have a clear owner and compatibility tests.
- Unreferenced modules and tests are removed only with dependency/search evidence and replacement coverage.
- Reports distinguish environment validation from application validation and production validation.

## Decisions to preserve during execution

- Treat the previous run as a triage baseline, not as a claim about every production environment.
- First align product expectations and fixtures; then correct the test or implementation at the owning layer.
- Prioritize correctness, authorization, data integrity, publication freshness, and media consistency before cosmetic cleanup.
- Keep changes in the root, frontend-cms, and backend-app repositories independently reviewable.
- Use small vertical slices with regression tests and explicit cross-app verification.

## Source documents

- CMS_AUDIT_2026-11-18.md — findings, local run results, and architecture map.
- CMS_AGENT_WORKFLOWS_GUIDE_2026-11-18.md — principles and agent workflows.
- Root and nested AGENTS.md files — operational rules that agents must follow.
- Root README.md and frontend-cms/README.md and backend-app/README.md — current run/build/schema boundaries; verify against source during execution.
