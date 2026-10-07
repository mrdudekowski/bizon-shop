# Static content revision verification

## Problem

The public site is exported as static files from data fetched from `backend-app`. After a CMS publication, Timeweb can report that its deployment succeeded without proving that the generated site contains the database revision that was just published. A database outage after a successful build leaves the previous static site available, so provider status alone cannot establish freshness.

## Goals

- Confirm that a completed static deployment contains the exact published content revision associated with the CMS publication.
- Reject a build if published content changes while its pages are being generated.
- Keep provider credentials and database access on the backend.
- Add no live database migration or content write.
- Preserve the existing static site when the build or verification fails.

## Approaches considered

1. **Stable content digest (chosen):** backend computes a deterministic digest over the published read model and its child relations. The CMS captures the expected digest after publication; a production build checks the digest before and after static generation and writes it into the export; after provider success, backend compares the public export's digest with the expected value. This proves content equality, detects changes during build, and requires no schema migration.
2. **Last-updated timestamp:** smaller payload and implementation, but timestamps can collide, fail to reflect child-relation edits consistently, or identify a change without proving the exported content matches.
3. **Persisted publication revision:** strongest explicit revision history, but requires a schema migration and a versioning lifecycle in PostgreSQL. It adds operational cost that is not needed for a first verification path.

## Design

### Revision contract

Backend exposes a read-only published-content revision endpoint. It hashes canonical JSON derived from every published entity and child relation consumed by the static public app. Inputs are ordered by stable table/key/order fields before serialization. Draft-only records are excluded. The endpoint returns a versioned payload such as `{ schema: 1, revision: "sha256:…" }`; the digest algorithm and included read models are documented beside the implementation so later API additions cannot silently escape coverage.

After a successful CMS publication, the backend reads and returns the resulting revision along with the provider deployment ID. The CMS stores both together while polling and after reload, then supplies the expected revision to the authenticated status lookup. The backend validates its format and compares it only with the public static marker; it does not treat it as an authorization credential.

### Production static build

The production build wrapper reads the revision before invoking `next build`, reads it again after static generation, and fails the deployment if the values differ or either request fails. If equal, it writes `content-revision.json` into the exported output with the schema version, digest, and build timestamp. The CI fixture build remains explicitly synthetic and must not emit a production-valid revision marker.

### Completion check

Once Timeweb reports deployment success, the authenticated backend status route fetches the configured public site's `content-revision.json` and compares its digest with the expected revision retained by the CMS. It returns `content_matches`, `content_mismatch`, or `verification_unavailable`; CMS displays “site updated” only for `content_matches`. Provider success with a mismatch or unreachable public file remains incomplete and is never presented as fresh content.

### Failure behavior and security

- Pre/post revision mismatch or API failure fails the new static build, leaving the host's previous successful export available under the provider's existing deployment behavior.
- Provider success does not imply content verification success.
- The backend owns public URL configuration and the comparison; the browser retains the expected digest only to resume polling after reload. The browser never receives provider credentials or connects to PostgreSQL.
- CMS polling remains bounded and distinguishes provider failure from content mismatch and temporary verification failure. Retry behavior continues to target provider failures; mismatch requires a fresh successful build after content stabilizes.
- No revision endpoint response includes row contents, credentials, or draft data.

## Acceptance criteria

- Every public read model used by static pages contributes to the digest, including child relations that affect rendered output.
- Identical published data yields the same digest; a change to published content or a rendered relation changes it.
- The production build writes a marker only after equal pre-build and post-build digests.
- A controlled build against a stable fixture succeeds; a fixture that changes during build fails and does not claim a valid marker.
- CMS reports the site updated only when provider status is successful and the public marker equals the revision captured after publication.
- API outage, missing marker, digest mismatch, and provider failure remain distinct visible states.
- No live migration, production publication, or deployment is part of implementation verification.

## Scope boundaries

This change does not guarantee an immediate database snapshot transaction across all Next.js page fetches. The pre/post comparison detects content changes during generation and prevents publishing a build that spans different revisions; a change after the post-build check is a later publication and triggers its own deploy. Provider retention and rollback behavior remain subject to separate Timeweb runtime verification.
