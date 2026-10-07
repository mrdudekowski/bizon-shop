# Remove SSR from the Public Site and CMS Implementation Plan

> **For agentic workers:** Implement this plan task by task with review checkpoints. Keep changes separated by repository and do not begin implementation until the user has reviewed this plan.

**Goal:** Deploy the public site and CMS as static files with no running Next.js server, while `backend-app` owns every server operation and connects to PostgreSQL and Timeweb S3.

**Architecture:** Keep Next.js if both applications can produce and serve the required static routes; do not rewrite to Vite/React unless a focused static-export spike proves Next.js cannot meet the route and content-update requirements. The public site pre-renders published pages, metadata, and sitemap during each static build. Browser-side forms and cart calls, plus all CMS operations, go directly to the backend API. Backend authentication, validation, rate limits, cart sessions, uploads, publication, database access, and static-site rebuild triggers remain server-side.

**Tech Stack:** Next.js 15 static export, Node.js 22 for App Platform builds and backend runtime, existing TypeScript `node:http` backend, PostgreSQL 16, existing Timeweb S3 bucket, Timeweb App Platform.

## Global Constraints

- Public site and CMS deployments must be static frontend applications with SSR disabled; neither may require a Node.js process after build.
- `backend-app` is the only long-running application server and is the only app allowed to hold database, S3, or Timeweb API credentials.
- Use Node.js 22 for the App Platform builds and backend runtime.
- Keep the public site in the `main-app` repository/branch, CMS in the `frontend-cms` repository/branch, and backend in the `backend-app` repository/branch. Check current branches before editing; the current CMS checkout is `frontend-cms-push`, so compare its commits with the user-designated `frontend-cms` branch and preserve all work before choosing the implementation branch.
- Each application has its own `package-lock.json`; deploy each repository with `npm ci` and use only that repository's lockfile.
- Never touch the experimental `frontend-dev-sasha` branch or checkout.
- The local PostgreSQL database remains the working source until the separate Timeweb migration and acceptance step. Do not create a separate backup. Any transfer file used during the requested migration is temporary and must be removed after reconciliation.
- Reuse the existing Timeweb S3 bucket; do not migrate or copy its objects as part of this refactor.
- Keep secrets out of Git and all frontend bundles. Do not commit any `.env` file.
- Preserve the current admin/editor accounts, passwords, roles, permissions, publication rules, audit history, and CMS workflows.
- Preserve media rules: reject upload before writing a media row if S3 is unavailable; show a readable reason; block deletion of media still in use and identify its use; retain admin-only deletion history; defer obsolete replacement-object cleanup until publication succeeds.
- Preserve the current user-owned untracked files in the root checkout, including `CMS_PRODUCTION_READINESS_AUDIT_2026-10-03.md`, `public/images/hero-tires/`, `public/images/premium/branding-cards/`, and `tmp/`. Do not stage or clean them.
- Keep commits separated by application repository and push only to the user-designated branches after implementation is approved.
- Follow the root `AGENTS.md` responsive CSS constraints if any layout CSS changes become necessary.

---

## Scope and Delivery Order

This is one coordinated refactor because the browser API contract, authentication cookies, publication freshness, and static deployment settings cross the site, CMS, and backend. Implement in this order: backend API readiness → public site static output → CMS static output → content rebuild flow → Timeweb migration and deployment → acceptance and cutover.

No Timeweb applications or database are created during the code-refactor tasks. The user has not selected custom domains; use technical domains for the first deployment rehearsal, then complete the final cookie and SEO checks after domains are chosen.

## Execution Status (2026-10-07)

- Backend code now owns requests, cart sessions, CORS, rate limiting, and the Timeweb static deploy trigger. Backend typecheck passes. Production CORS origins, trusted proxy behavior, and the live Timeweb deploy response still need cloud verification.
- Public site and CMS both build as static exports locally. The public export contains 49 generated routes; CMS contains 19 static routes. Both typechecks pass. The site build used the existing local backend and published content.
- CMS and public browser calls now target explicit backend URLs. The CMS build fails early when `NEXT_PUBLIC_ADMIN_API_URL` is missing; the public site validates both build and browser API URLs in its Next config.
- No cloud app, database, or backup was created. Timeweb migration and end-to-end acceptance remain pending.

## Task 1: Freeze the Existing API and Content Contract

**Files to inspect:**

- `src/app/api/requests/route.ts`
- `src/app/api/cart/route.ts`
- `src/lib/requests/submitRequest.ts`
- `src/lib/requests/validateRequest.ts`
- `src/lib/requests/normalizeRequest.ts`
- `src/lib/security/rateLimit.ts`
- `src/lib/cart/cartStorage.ts`
- `src/lib/content/publishedClient.ts`
- `src/lib/content/getPageContent.ts`
- `src/lib/content/staticCatalog.ts`
- `frontend-cms/src/app/v1/[...path]/route.ts`
- `frontend-cms/src/app/api/admin/route.ts`
- `frontend-cms/src/admin/client/localStore.ts`
- `backend-app/src/server.ts`
- `backend-app/src/admin/server/adminAuth.ts`
- `backend-app/src/adminCors.ts`
- `backend-app/src/admin/server/postgresAdmin.ts`
- `backend-app/src/storage/putMedia.ts`

- [ ] Write a route matrix for public reads, requests, cart, CMS login/session/logout, admin CRUD, media upload/replacement/deletion, publication, and password reset. Record which backend handlers already exist and which behavior currently lives only in a Next.js route.
- [ ] Record request and response shapes before moving behavior. In particular, preserve the current `POST /v1/requests` input behavior, the `/v1/cart` session behavior, the admin session cookie, and the CMS `{ ok, result, code }` response format.
- [ ] Record publication timing for every dynamic public route: tire types/models, shop categories/products, wheels, and Tire IQ articles. Mark which pages currently create metadata or sitemap entries from backend data.
- [ ] Confirm whether Timeweb's public frontend SPA fallback works with the Next.js App Router for direct loads of nested and dynamic paths. Use a minimal disposable static build on a technical domain; do not use or modify `frontend-dev-sasha`.
- [ ] Confirm the exact Timeweb deploy API request and token permissions for rebuilding the static site after a CMS publication. The Timeweb Cloud API exposes `POST /api/v1/apps/{app_id}/deploy`; validate the request against the current official SDK/API before wiring it into backend code.

**Exit condition:** The route matrix is complete; all static-route, content-refresh, CMS-cookie, and Timeweb deploy-trigger constraints are known. If Next.js cannot pass the static route spike, use a Vite React SPA for that app rather than enabling SSR.

## Task 2: Make Backend the Sole Owner of Runtime Operations

**Files:**

- Modify: `backend-app/package.json`
- Modify: `backend-app/package-lock.json`
- Modify: `backend-app/src/server.ts`
- Modify: `backend-app/src/adminCors.ts`
- Modify: `backend-app/src/admin/server/adminAuth.ts`
- Create: `backend-app/src/requests/validateRequest.ts`
- Create: `backend-app/src/requests/normalizeRequest.ts`
- Create: `backend-app/src/security/rateLimit.ts`
- Modify: `backend-app/src/admin/server/postgresAdmin.ts` only where existing media/publication behavior needs the new static rebuild hook
- Modify: `backend-app/src/readiness.ts` only if the current health response needs a separate process-only health path
- Modify: `backend-app/.env.example`

- [ ] Configure the HTTP server to use `process.env.PORT` with local default `4000` and bind to `0.0.0.0` in App Platform. Keep the local development command available.
- [x] Add the production script `"start": "tsx src/server.ts"`, move `tsx` into `dependencies`, and update `package-lock.json`. Keep the local `dev` command loading `.env`; production start must not read `.env` from disk. Install with `npm ci` and keep credentials in App Platform variables. Ensure the backend starts only after its current schema readiness check succeeds.
- [ ] Keep `/health` independent of PostgreSQL so App Platform can check the process. Keep database/schema readiness checks separate and visible in backend logs/readiness responses.
- [x] Move request body validation, normalization, honeypot handling, source-IP handling, and rate limiting from `src/lib/requests/*` and `src/lib/security/rateLimit.ts` into backend modules. Apply them before `insertRequest`; preserve existing user-facing error messages and status behavior.
- [x] Derive the rate-limit key from the actual client address supplied by the trusted App Platform ingress. Do not accept arbitrary caller-provided forwarded-IP headers as authoritative. (Uses the socket peer by default; proxy hops remain 0 until Timeweb ingress behavior is confirmed.)
- [x] Move HTTP-only cart-cookie creation, reading, and clearing into backend `/v1/cart`. Keep the cart token opaque to JavaScript. The browser sends credentialed requests; backend continues to persist cart contents through existing database functions.
- [x] Add exact-origin CORS handling for the site and CMS to backend responses, including preflight requests and credentialed responses. Never use `Access-Control-Allow-Origin: *` with cookies. Read allowed origins from server environment variables and reject unlisted state-changing origins.
- [ ] Preserve admin authorization in backend for every operation. UI role checks are only presentation; they are not a security boundary.
- [ ] Confirm backend owns the complete upload, replacement, delete-in-use, delete-history, and S3 failure behavior. Keep all S3 credentials and object deletion in backend only.
- [x] Add a backend-only Timeweb static-site deploy client after Task 1 verifies the API. Keep its token and public-site App ID in backend environment variables. Provide an admin-only retry path and a readable CMS response when publication succeeds but a site rebuild could not be started. (Client and retry path implemented; credentials and live API response not verified.)

**Verification:** Run `npm ci` and `npm run typecheck` in `backend-app`; start the app with its production command and confirm it listens on the configured port and `/health` returns `200` without reading `.env`.

**Exit condition:** The site and CMS can perform every required server operation through backend endpoints, and backend requests remain protected by server-side validation, authorization, origin checks, and rate limits.

## Task 3: Convert the Public Site to Static Output

**Files:**

- Modify: `next.config.mjs`
- Modify: `src/app/api/requests/route.ts` — remove after the backend request flow is live
- Modify: `src/app/api/cart/route.ts` — remove after the backend cart flow is live
- Modify: `src/lib/requests/submitRequest.ts`
- Modify: `src/lib/cart/cartStorage.ts`
- Modify: `src/lib/content/publishedClient.ts` and the public content client modules under `src/lib/content/`
- Modify: `src/app/(site)/**/*.tsx` pages that currently call server-only content loaders or use request-time `searchParams`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/robots.ts`
- Modify: `src/lib/seo/metadata.ts`
- Modify: image components/configuration where static export requires an unoptimized image or direct S3 URL
- Modify: `.env.example`

- [x] Enable Next.js static export with `output: "export"`. Set the frontend build output to `out/` in Timeweb. Ensure the production app has no `start` command and does not require Node.js after build. (Static output/no `start` is verified locally; Timeweb configuration is pending.)
- [ ] Keep published content reads in build-time server components so product pages, page metadata, canonical URLs, and sitemap are present in the static files. Add an explicit build-time fetch path using `CONTENT_API_URL` and static cache semantics; do not use the current `cache: "no-store"` request-time path for static page generation. The build API URL is public and contains no credentials.
- [x] Use a public `NEXT_PUBLIC_API_URL` for browser-side form and cart calls only. Do not put database, S3, or Timeweb credentials in `NEXT_PUBLIC_*` variables.
- [x] Move form submission to backend `/v1/requests`; remove the Next.js `/api/requests` proxy after the browser flow passes. (Code moved; browser submission still needs end-to-end verification.)
- [x] Move cart synchronization to backend `/v1/cart` with credentialed fetch and the backend-owned HTTP-only cookie; remove the Next.js `/api/cart` proxy after refresh/reopen behavior passes. (Code moved; persistence still needs end-to-end verification.)
- [x] Convert pages that await request-time backend data or request-time URL parameters into static build-time content generation or client-side interaction as appropriate. Preserve filtering, variant selection, cart state, request forms, and published/unpublished visibility rules. (Static build succeeds; browser behavior remains to verify.)
- [ ] Keep all current public URL shapes. Generate static paths for published database-backed routes during the build. Confirm that a newly published slug becomes reachable after the static rebuild completes.
- [x] Fail the static build if required published API data cannot be loaded; never turn a backend outage into a successful empty catalog, empty sitemap, or removal of published routes.
- [x] Convert `sitemap.ts`, `robots.ts`, canonical URLs, product metadata, and Open Graph metadata to static build output based on the published data available to that build.
- [x] Preserve public images from Timeweb S3 without relying on the Next.js runtime image optimizer.
- [ ] Configure the Timeweb frontend SPA fallback only if the static route spike proves that it works with the built Next.js router. If it does not, keep generated HTML for every published public slug and rebuild after publication; do not silently serve the homepage as a product page.

**Verification:** Run `npm run typecheck` and `npm run build` in the root application. The build must produce `out/`; opening the built files must not require a Next.js server. Manually open home, shop category, product, tire model, wheel model, Tire IQ article, cart, and contact pages directly by URL on the technical domain. Verify a CMS-published content change appears after the next successful static rebuild.

**Exit condition:** The public site serves only static files, calls backend for live operations, and preserves accepted URLs, metadata, forms, cart behavior, and content freshness.

## Task 4: Convert CMS to Static Output

**Files:**

- Modify: `frontend-cms/next.config.mjs`
- Remove: `frontend-cms/src/app/v1/[...path]/route.ts`
- Remove: `frontend-cms/src/app/api/admin/route.ts`
- Modify: `frontend-cms/src/admin/client/localStore.ts`
- Modify: `frontend-cms/src/admin/client/errors.ts` and `errorText.ts` only for new backend/network error codes
- Modify: `frontend-cms/src/app/**/page.tsx` dynamic editor routes and the links that open them
- Modify: `frontend-cms/.env.example` (create if absent)

- [x] Enable `output: "export"`; configure the frontend build to serve `out/` with SSR disabled and no CMS Node.js process. (Local build verified; Timeweb serving configuration is pending.)
- [x] Set a required public `NEXT_PUBLIC_ADMIN_API_URL` for the backend API. Change the browser client from same-origin `/v1/*` to the explicit backend URL and retain `credentials: "include"`.
- [x] Replace ID-in-path editor routes with static editor paths and query parameters (for example, an editor page plus `?id=<id>`). Keep list pages static and keep IDs out of the build-time route inventory.
- [x] Remove the Next.js `/v1/*` proxy and blocked `/api/admin` handler. The static CMS contains no server route handlers.
- [ ] Configure backend CORS for the exact CMS origin and credentialed requests. Keep the session cookie `HttpOnly`, `Secure` on HTTPS, and `SameSite=Lax` when CMS and API are same-site subdomains. Confirm the chosen production domain arrangement supports this before final acceptance.
- [ ] Verify login, reload, session expiry, logout, admin/editor permissions, password reset by a second admin, drafts, publication, product/category editing, and all media operations through the backend API.
- [ ] Verify the browser build contains only public API URLs. Search the generated `out/` bundle for database passwords, S3 credentials, bootstrap secrets, and Timeweb API tokens; the search must find none.

**Verification:** Run `npm run typecheck` and `npm run build` in `frontend-cms`. The build must produce `out/` and the CMS must work from a static technical domain with direct page refreshes on list and editor URLs.

**Exit condition:** CMS is static, all reads/writes go to backend, login survives refresh, and backend enforces all roles and permissions.

## Task 5: Keep Static Public Pages Current After CMS Publication

**Files:**

- Modify: `backend-app/src/server.ts` or the existing admin dispatch boundary that owns successful publish operations
- Create: `backend-app/src/deploy/timewebApps.ts`
- Modify: CMS publication success/error UI in `frontend-cms/src/admin/**`
- Configure: Timeweb App Platform variables for backend only

- [x] Trigger a static-site deployment only after a successful publication transaction, not after draft saves. (Code path implemented; cloud behavior pending.)
- [x] Coalesce multiple publications in one editorial operation into one site build. Keep the CMS response clear: publication saved, site build started, or publication saved but build trigger failed. (Success/failure status and retry UI implemented; cloud behavior pending.)
- [x] Add an admin-only retry action for a failed build trigger. Do not send the Timeweb token to the CMS or public site.
- [ ] Confirm a Timeweb deployment builds from the intended `main-app` commit and reads current published content from backend at build time. Never expose the cloud database connection string to the frontend build output.
- [ ] Ensure a failed static build leaves the previous successful static deployment serving the site and reports the failure in CMS/backend logs.
- [x] Regenerate sitemap and page metadata during each successful build so newly published and removed routes are reflected. (Local export verified.)

**Verification:** Publish one test change, confirm the backend starts exactly one new static deployment, confirm the published page and metadata change after deployment, and confirm a failed deployment leaves the previous site available with a visible retry path.

**Exit condition:** CMS publication updates both the backend read model and the static public site through a documented, observable build flow.

## Task 6: Deploy and Migrate to Timeweb

**Files:**

- Modify: `.env.example`, `backend-app/.env.example`, `frontend-cms/.env.example`
- No secrets or actual `.env` files are committed.

- [ ] Create the managed PostgreSQL 16 cluster and private network in the same Timeweb region as the backend and existing S3 where available. Keep the final database private to backend after migration.
- [ ] Keep the local PostgreSQL database as source while preparing the cloud target. Do not make a separate backup. Transfer the database once from the local machine using a temporary migration stream/file, reconcile table counts and migration ledger, then remove that temporary artifact.
- [ ] Create the required application database user on Timeweb; do not assume database import transfers PostgreSQL roles. Preserve current admin/editor rows and do not seed, reset passwords, or add users during migration.
- [ ] Verify the migrated schema version, content counts, account roles/statuses, and representative published/draft content before switching the backend connection string.
- [ ] Deploy backend from `backend-app` on Node.js 22 with the production start command, `/health` check, private database address, current S3 secrets, exact allowed origins, and server-only Timeweb deploy credentials.
- [ ] Deploy root site from `main-app` as a static frontend on Node.js 22 build mode, output directory `out/`, SSR disabled, and SPA fallback only if the verified route setup requires it.
- [ ] Deploy CMS from `frontend-cms` as a static frontend on Node.js 22 build mode, output directory `out/`, SSR disabled, with `NEXT_PUBLIC_ADMIN_API_URL` set to the backend technical domain.
- [ ] Test all three apps on technical HTTPS domains before choosing custom domains. Record App IDs, technical addresses, build commands, health path, and environment variable names without recording secret values.
- [ ] After custom domains are selected, use site, CMS, and API addresses under the intended domain plan; update exact CORS allowlists and repeat cookie, login, cart, upload, metadata, and direct-route checks.

**Exit condition:** Timeweb database is the active database only after reconciliation; backend is healthy; site and CMS are static deployments; CMS and site can reach the backend; database public access is disabled after transfer.

## Task 7: Production Acceptance and Repository Handoff

- [ ] Confirm the Timeweb dashboards identify the public site and CMS as frontend/static apps with SSR disabled. Confirm only backend runs a Node.js server.
- [ ] Manually check a representative end-to-end flow for each area: public catalog read/filter, CMS edit/save/draft/publish, new public content after rebuild, request creation, cart persistence across reload, admin/editor access, upload success, upload failure with no media row, in-use media deletion blocked, deletion history visible to admins only, and replacement cleanup after publication.
- [ ] Confirm no browser request targets `localhost`, `127.0.0.1`, or a local development port.
- [ ] Confirm database access is private to backend, S3 access is backend-only, public reads expose only published content, and no secrets occur in static bundles.
- [ ] Confirm direct URL loads and refreshes for representative public and CMS nested URLs, plus `robots.txt`, `sitemap.xml`, canonical URLs, and product/article metadata.
- [ ] Record remaining limitations explicitly, especially any search-result behavior that depends on the static rebuild finishing.
- [ ] Commit and push root-site changes separately to `main-app`, CMS changes separately to `frontend-cms`, and backend changes separately to `backend-app`. Stage only explicit paths; leave unrelated root untracked files untouched.

**Final acceptance condition:** The browser loads static files for both public site and CMS. All privileged and persistent operations run in `backend-app`. No site or CMS SSR process is deployed or required for a normal request.

## Rollback Notes

- Keep the last successful static deployments and backend deployment available in Timeweb for code rollback.
- During rehearsal, keep the local database untouched as the migration source. Do not route live writes to both databases.
- After cloud cutover, rollback application code to the previous compatible backend/static build while keeping the single active cloud database. Do not silently switch back to the local database after cloud writes have begun.
- If static CMS authentication cannot pass with the selected domain arrangement, stop before disabling the current CMS server and resolve same-site cookie/domain routing first.
- If the public static build cannot preserve new content URLs or acceptable metadata, stop before disabling the current public SSR app and resolve the static route/rebuild strategy.

## References

- [Timeweb frontend App Platform and SSR/static modes](https://timeweb.cloud/docs/apps/deploying-frontend-apps)
- [Timeweb frontend request-based pricing](https://timeweb.cloud/docs/apps/frontend-pricing)
- [Timeweb frontend SPA fallback](https://timeweb.cloud/docs/apps/reverse-proxy)
- [Timeweb backend app setup and private network](https://timeweb.cloud/docs/apps/deploying-backend-applications)
- [Timeweb App Platform deploy API in the official SDK](https://github.com/timeweb-cloud/sdk-go/blob/main/api_apps.go)
- [Next.js static export limitations](https://nextjs.org/docs/app/guides/backend-for-frontend#export-mode)
