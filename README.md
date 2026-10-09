# BIZON public site

The public BIZON site and Shop use Next.js 15 with static export. During a production build, published content and catalog routes are read from `backend-app` through `CONTENT_API_URL`. A CMS publication requests a new static-site deploy; it does not update already exported pages in place.

The system has three independent applications:

| Application | Directory | Local port | Responsibility |
| --- | --- | ---: | --- |
| Public site | repository root | 3000 | Visitor pages, catalog, forms and cart UI |
| CMS | `frontend-cms/` | 3001 | Content editing, media and publication workflow |
| Backend API | `backend-app/` | 4000 | Authentication, CMS operations, published read API, requests, cart and media persistence |
| PostgreSQL | Docker Compose | 5433 | Persistent application data |

The backend is the only application that connects to PostgreSQL. The CMS calls its admin API from the browser. The public site calls public API routes for forms and cart; its published page data is fetched during the static build.

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

The CMS build requires `NEXT_PUBLIC_ADMIN_API_URL`. The public production build requires `CONTENT_API_URL` and `NEXT_PUBLIC_API_URL`; `npm run build` also compares published-content revisions before and after static generation and writes `out/content-revision.json` only when they match. The backend uses `PUBLIC_SITE_URL` to verify that marker after a Timeweb deployment. `npm run build:ci` uses an empty, local API fixture to validate static generation in CI; it does not validate database content or emit a production content revision.

## Validation

Each application has its own CI workflow. Run that application's scripts from its directory. The root workflow validates the public site; the CMS and backend workflows validate their respective independent repositories. Cross-application API compatibility still requires the end-to-end contract checks described in the architecture audit.

See [AUDIT.md](./AUDIT.md) for historical migration notes. Check the current source and `docs/` audit before treating older notes as current architecture.

The `/cart` flow and the BIZON Shop `/shop/cart` flow keep separate items, sessions, and submitted requests. They share the same contact fields, while the request source and cart contents stay specific to each flow.
