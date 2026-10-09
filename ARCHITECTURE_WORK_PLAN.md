# BIZON architecture work plan

This plan records the audit findings and implementation pipeline. The user authorized work to begin on the publication-confirmation and Tire IQ taxonomy findings; database migration remains gated on deployment and recovery evidence.

## Finding 1 — Database provisioning and recovery

### Current understanding

- Production PostgreSQL is reported by the user to run in Timeweb Cloud.
- The checked-out local configuration is still a development setup: `backend-app/.env` and `frontend-cms/.env.local` target `127.0.0.1:5433`; root `.env.local` points public content reads to `127.0.0.1:4000`. These files do not reveal or verify the Timeweb database.
- The local Docker database `bizon` answered queries and has the core application schema plus all seven backend migration versions. This proves only local readiness.
- The backend repository has no core-schema baseline or restore artifact. Its migrations begin by altering an existing `users` table; later migrations also require existing `shop_categories`, `products`, and `media` tables.
- `docker-compose.yml` starts an empty PostgreSQL service. Running the current migration command against a newly created empty database is therefore not a documented bootstrap path.
- The checked-in deployment plan and static runtime contract say the cloud database migration was still pending when those documents were written. They conflict with the current user report and must be treated as stale until reconciled.

### Problem statement

There is no repository-backed, verified procedure for provisioning or restoring the PostgreSQL schema. This is not evidence that the current Timeweb database is failing. Its actual schema version, backup policy, and restore path have not been verified from the available local configuration.

### Proposed investigation before choosing an implementation

1. Confirm the Timeweb database instance used by the deployed backend and the configured migration procedure, using read-only access.
2. Record sanitized metadata: PostgreSQL version, schema/table/column/index inventory, current backend migration ledger, and database size. Exclude row contents and credentials.
3. Identify the source of the core schema: prior Payload migration history, a restored dump, a provider template, or another provisioning process.
4. Confirm automated backup retention and whether a restore rehearsal has been completed. Do not initiate a restore during this investigation.
5. Compare the deployed schema with the local schema and the assumptions in backend migrations.

### Candidate implementation direction — pending review

Make the supported schema reproducible from versioned project artifacts while preserving the existing Timeweb database and its data. Select the exact mechanism only after identifying the live schema owner and existing backup/restore process.

### Acceptance criteria to agree

- A newly provisioned isolated PostgreSQL database can be brought to the backend's expected schema through a documented, version-controlled procedure.
- The current Timeweb database can be recognized as already provisioned without destructive initialization or data loss.
- The backend migration ledger and readiness check agree with the schema expected by the deployed backend.
- Backup and recovery instructions identify the responsible service and have a verified restore procedure in an isolated environment.

### Status

**Evidence review in progress — live schema checked read-only on 2026-10-07.** The Timeweb database records backend migrations `202610030001` through `202610060007`; `202610070008` is not applied. Its target `pages` columns and `pages_shop_catalog_tiles` table are absent. The migration would add four page columns and seed tiles from the existing published categories. Current source counts are one `shop-home` page, five published categories, two carousel rows for published categories, and 39 media records. No database change, export, backup, or cloud deployment was performed.

The current backend checkout expects every migration through `202610070008` at startup. If that checkout is the deployed version, schema readiness will prevent it from starting; deployed revision and runtime state are not yet verified. The three repositories have existing uncommitted changes, which must be preserved during any implementation.

**Next pipeline steps:**

1. Confirm which backend revision is deployed and whether it is currently healthy.
2. Verify the provider's backup retention and the available restore procedure; do not initiate a restore.
3. Rehearse migration `202610070008` against an isolated copy or staging database, then verify the expected five tiles and preserved existing data.
4. Schedule the production migration through the repository migration runner, then re-read the migration ledger, schema readiness, and published Shop API.

**Gate:** production migration waits until steps 1–3 establish a compatible deployed backend and a recoverable database state. The migration is additive, but its seed rows affect live published Shop content and therefore require the normal release window and post-migration readback.

## Finding 2 — CMS publication and public-site confirmation

### Current understanding

- The public Next.js app uses static export and reads published API data during its build (`cache: "force-cache"`). A database publication is not visible on the current static site until a new build completes.
- After a successful admin publication, the backend calls Timeweb's deploy endpoint. It currently treats any successful HTTP response as `started` and does not return the provider's deploy ID or commit SHA.
- CMS receives only `started`, `failed`, or `not_configured`. One editor message previously claimed the new version was already on the site; that copy now says **“Опубликовано в CMS.”**
- Timeweb's official SDK documents a deploy-history endpoint and deploy records containing an ID, commit SHA, start/end times, and status. This makes status polling feasible while keeping the provider token in the backend. [Apps API](https://github.com/timeweb-cloud/sdk-javascript/blob/main/docs/AppsApi.md), [Deploy record](https://github.com/timeweb-cloud/sdk-javascript/blob/main/docs/Deploy.md), [Deploy statuses](https://github.com/timeweb-cloud/sdk-javascript/blob/main/docs/DeployStatus.md).
- The provider's source commit identifies the code revision; it does not identify which database content snapshot the static build consumed. A separate content revision marker is needed for end-to-end freshness proof.

### Problem statement

CMS can confirm that the backend accepted a publication and requested a deploy, but it cannot confirm that the provider finished successfully or that the public static output contains the newly published database content.

### Candidate implementation direction — pending review

1. Have the backend capture the Timeweb deploy ID and commit SHA, and expose an authenticated status lookup that polls the provider without exposing its token to the browser.
2. Add a content snapshot identifier to the static build output and compare it with the revision expected for the publication.
3. Make CMS show separate states for “published in CMS”, “site build running”, “site build failed”, and “site updated”; offer retry only when the provider reports failure.
4. Keep status updates bounded and resilient to a CMS reload. Decide whether deploy operation state belongs in PostgreSQL or can be recovered safely from provider history before adding schema.

### Acceptance criteria to agree

- A successful CMS publication returns a traceable provider deploy ID without returning credentials.
- CMS shows completion only after the provider reports success and the public site's content revision matches the published snapshot.
- Build failures remain visible with a safe retry path; a started request is never reported as completed.
- The check is validated against a controlled publication in a non-production environment before enabling the workflow in production.

### Status

**Implementation present in local source; runtime confirmation pending.** Backend now captures the Timeweb deploy ID and the published-content digest, exposes an authenticated status lookup, and compares the public static marker after provider success. The production build wrapper reads the digest before and after static export, fails on an API error or revision change, and writes `out/content-revision.json` only after a match. CMS persists the deploy ID and expected digest, resumes polling after reload, and reports the site updated only after provider success and digest match. Backend, CMS, and root typechecks pass; the build wrapper passes `node --check`.

Production configuration and runtime proof remain outstanding: `PUBLIC_SITE_URL` must be set in backend deployment variables; Timeweb's configured build command must call `npm run build`; provider token permissions and the target public URL must be confirmed; and a controlled non-production publication/build must prove marker readback. No tests, production build, migration, or production deploy were run. The Timeweb database still lacks migration `202610070008` according to the read-only audit, so a production deployment may remain blocked until the separate database recovery gate is resolved.

## Finding 3 — Tire IQ taxonomy disconnected from CMS and API

### Evidence

- The live database has `tire_iq_articles_taxonomy` relations attached to 13 articles (37 relation rows); the nine stored topic values match the public site's existing taxonomy vocabulary.
- The Next.js public page already forwards `article.taxonomy` to its listing, and the UI already filters articles by those values.
- The backend published-read path and admin article mapper previously omitted taxonomy, and the CMS editor had no control for it. Existing CMS drafts therefore could not intentionally preserve or edit those relations during publication.

### Implementation status

Taxonomy values now flow from the relation table through published backend API reads to the public listing. The CMS material editor exposes all nine existing topics; saved drafts retain selections; legacy overlays that lack the new property inherit current database relations. Publication replaces ordered relation rows inside the existing transaction. Backend and CMS TypeScript checks pass.

### Remaining verification

No migration or live write was needed or performed. The deployed backend/CMS revisions are not confirmed, and no controlled material publication has verified persistence, API readback, or the public filter after a static rebuild. Keep the live data unchanged until this is checked through staging or an approved controlled release.

## Remaining audit findings

To be added and reviewed one at a time, in priority order from `ARCHITECTURE_AUDIT_2026-10-07.md`.
