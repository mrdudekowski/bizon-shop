# BIZON public site

The public BIZON site and Shop use Next.js 15 with static export. During a production build, published content and catalog routes are read from `backend-app` through `CONTENT_API_URL` to generate HTML and SEO metadata. The Shop home, categories, product pages, wheel model pages, and tire variant tables then refresh their published data from the public API in the visitor's browser, so edits to these records do not wait for a rebuild. Other public routes currently remain build-time snapshots. A CMS publication may still request a deploy to refresh SEO HTML and generated routes.

The system has three independent applications:

| Application | Directory | Local port | Responsibility |
| --- | --- | ---: | --- |
| Public site | repository root | 3000 | Visitor pages, catalog, forms and cart UI |
| CMS | `frontend-cms/` | 3001 | Content editing, media and publication workflow |
| Backend API | `backend-app/` | 4000 | Authentication, CMS operations, published read API, requests, cart and media persistence |
| PostgreSQL | Docker Compose | 5433 | Persistent application data |

The backend is the only application that connects to PostgreSQL. The CMS calls its admin API from the browser. The public site calls public API routes for forms and cart; published data is read at build time for static HTML and refreshed in the browser on the main Shop and catalog routes after page load.

## Local development

Install dependencies in each Node application. Configure the public site with `.env.local`, CMS with `frontend-cms/.env.local`, and backend with `backend-app/.env`. Do not copy backend credentials into the site or CMS environment.

Start PostgreSQL with `docker compose up -d postgres`, then run the existing database migrations from `backend-app` with `npm run db:migrate` against the intended local database. Start each application in a separate terminal:

```powershell
# repository root
npm run dev

# frontend-cms
npm run dev

# backend-app
npm run dev
```

The CMS build requires `NEXT_PUBLIC_ADMIN_API_URL`. The public production build requires `CONTENT_API_URL`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_SITE_URL` (an HTTPS origin with no path). It reads `/v1/content/snapshot` once, checks that snapshot against the publication revision before and after Next.js export, and serves all build-time content reads from that same local snapshot. The export copies referenced S3 media under `out/snapshot-media/`, rewrites page and CSS references to local paths, and writes `content-revision.json`, `media-manifest.json`, and `content-snapshot.json` only after the checks pass. If `PUBLIC_SITE_URL` is available, the build can reuse a checksum-verified media file from the currently served release when the source object is temporarily unavailable; it only reuses an exact matching source URL. The backend uses `PUBLIC_SITE_URL` to verify that the deployed revision marker and media manifest both contain the expected revision. `npm run build:ci` uses a local API fixture to validate snapshot-based static generation; it does not validate live database content or production media.

## Validation

Each application has its own CI workflow. Run that application's scripts from its directory. The root workflow validates the public site; the CMS and backend workflows validate their respective independent repositories. Cross-application API compatibility still requires the end-to-end contract checks described in the architecture audit.

See [AUDIT.md](./AUDIT.md) for historical migration notes. Check the current source and `docs/` audit before treating older notes as current architecture.

The `/cart` flow and the BIZON Shop `/shop/cart` flow keep separate items, sessions, and submitted requests. They share the same contact fields, while the request source and cart contents stay specific to each flow.
