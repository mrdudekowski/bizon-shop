# backend-app

HTTP read API for published BIZON catalog content. Listens on `http://127.0.0.1:4000`.

## Run

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URI
npm run dev
```

`DATABASE_URI` is required for data routes (`/v1/...`). There is no default connection string.
The dev script reads it from `.env`, so the server does not depend on what the shell happens to export.

`GET /health` answers `{ "ok": true }` without contacting the database.

## Routes

- `GET /health`
- `GET /v1/tires/types`
- `GET /v1/tires/types/:slug`
- `GET /v1/tires/types/:slug/models`
- `GET /v1/tires/models/:typeSlug/:modelSlug`
- `GET /v1/tires/models/:id/variants`
- `GET /v1/pages/home`
- `GET /v1/articles`
- `GET /v1/articles/:slug`
- `GET /v1/pages/:key` for about, contact, warranty, branding, become-a-supplier, privacy-policy, shop-delivery-returns
- `GET /v1/wheels/types`
- `GET /v1/wheels/types/:slug`
- `GET /v1/wheels/types/:slug/models`
- `GET /v1/wheels/types/:slug/variants`
- `GET /v1/wheels/models/:typeSlug/:modelSlug`
- `GET /v1/wheels/models/:id/variants`
- `GET /v1/shop/categories`
- `GET /v1/shop/categories/:slug`
- `GET /v1/shop/products` (`?category=` filters by category slug)
- `GET /v1/shop/products/:slug`
- `POST /v1/admin` JSON `{ method, args }` — the only catalog writer. Same `AdminClient` methods and error codes as the CMS. Browser calls from `localhost` / `127.0.0.1` are allowed.
- `POST /v1/requests` stores one normalized lead.
- `GET` / `PUT` / `DELETE /v1/cart` with header `x-cart-token`. The site keeps the opaque `bizon-cart-session-v1` cookie and stores only its hash.

Unknown slug → `404` `{ "ok": false }`. Database error → `500` `{ "ok": false }` (no SQL text, no connection string).

## Test

```bash
npx vitest run
```
