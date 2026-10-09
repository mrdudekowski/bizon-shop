# BIZON backend API

The backend is the single application boundary for PostgreSQL. It serves the CMS admin API, public published-content read API, media operations, request intake and cart persistence. Development listens on `127.0.0.1:4000` and `::1:4000`; production listens on `0.0.0.0` at `PORT` or `4000`.

## Run locally

```powershell
npm install
Copy-Item .env.example .env
# Set DATABASE_URI and any required CMS/S3 settings in .env.
npm run db:migrate
npm run dev
```

Migrations are explicit. The server checks the migration ledger and does not apply schema DDL at startup. Run migrations only against the intended database.

The migrations in this repository are additive: they assume the existing BIZON core tables, including `users`, `media`, and `products`. Docker Compose starts an empty PostgreSQL database and does not create or import that baseline schema. A canonical baseline-schema provisioning or restore procedure is not included here, so a fresh empty database is not ready for `npm run db:migrate` by itself.

## Routes

- `GET /health` — process liveness; does not contact PostgreSQL.
- `GET /ready` — database connectivity and schema readiness.
- `POST /v1/admin/auth/login`, `GET /v1/admin/auth/session`, `POST /v1/admin/auth/logout` — CMS session lifecycle.
- `POST /v1/admin` — authenticated CMS operation dispatch using `{ method, args }`.
- `POST /v1/admin/assets`, `PUT /v1/admin/assets/:id`, `DELETE /v1/admin/assets/:id/replacement` — media upload/replacement operations.
- `POST /v1/admin/site-deploy/retry` — retry the public static-site deploy request.
- `GET /v1/content/revision` — read a stable digest of all published data used by static pages.
- `GET /v1/tires/*`, `GET /v1/wheels/*`, `GET /v1/shop/*`, `GET /v1/pages/*`, `GET /v1/articles*` — published read API.
- `POST /v1/requests` — validated lead submission. The Bizon site and BIZON Shop send separate requests (`sourceForm: tire_cart` and `sourceForm: shop_cart`) while using the same contact fields.
- `GET`, `PUT`, `DELETE /v1/cart?kind=bizon|shop` — isolated cart sessions. Bizon and Shop use separate `HttpOnly` cookies (`bizon-site-cart-session-v1` and `bizon-shop-cart-session-v1`); the database stores only token hashes.
- `POST /v1/cart/migrate` — splits a legacy mixed cart into the two typed sessions while preserving unmapped items for recovery.

Browser origins for public routes are configured by `CORS_ALLOWED_ORIGINS`. CMS admin routes use the separate `CMS_ALLOWED_ORIGINS` list. Production must set both lists to the exact intended origins; the development defaults allow the public site on port `3000` and the CMS on port `3001` for their separate route groups.

For static-site freshness checks, set backend `PUBLIC_SITE_URL` to the HTTPS origin serving the public export. After Timeweb reports deployment success, the backend compares the exported `content-revision.json` against the digest captured after the CMS publication.

Unknown routes and slugs return 404. Database failures return generic errors without SQL text or connection details. The API emits request IDs and structured request logs.

## Checks

```powershell
npm run typecheck
npm test
```

