# backend-app agent rules

Before working in this repository, read the project-wide rules in ../AGENTS.md. They apply to this repository and take precedence for shared workflows.

## Backend-specific boundaries

- This service owns PostgreSQL access and the server-side admin and public API contracts. Keep database access in backend modules.
- Check authorization, capability checks, origin rules, input validation, status transitions, and error mapping at the server boundary. CMS UI checks are not a substitute.
- Keep admin operation names/arguments and public response shapes compatible with their separate consumers. Update or add contract tests when changing a boundary.
- Preserve transaction boundaries for multi-record publication and related writes. Test rollback and partial-failure behavior at the appropriate integration level.
- Keep health and readiness distinct. Confirm database schema readiness before database-backed tests; server liveness alone does not prove the data layer is ready.
- Migrations are explicit. Do not add runtime DDL or run migrations against an unverified database. The empty Docker database does not by itself provision the core Bizon schema; confirm the baseline and target database first.
- Media operations span PostgreSQL metadata and S3-compatible objects. Consider cleanup/compensation, references, object integrity, and failure between storage steps.
- Keep Timeweb, S3, email, and other external credentials on the backend. Isolate external clients behind narrow modules and test timeout/retry/idempotency behavior.
- Use the isolated CMS E2E DB and local S3-compatible bucket for write tests. Never use production credentials or production URLs in a test harness.

## Backend completion evidence

Report endpoint/operation, authorization and data contract, database/storage effects, migration implications, tests run and results, and whether the public consumer was checked. Do not claim a public CMS flow is verified from backend unit tests alone.
