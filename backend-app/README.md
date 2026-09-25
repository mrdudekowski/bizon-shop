# backend-app

HTTP read API for published BIZON catalog content. Listens on `http://127.0.0.1:4000`.

## Run

```bash
npm install
npm run dev
```

`DATABASE_URI` is required for data routes (`/v1/...`). There is no default connection string.

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

Unknown slug → `404` `{ "ok": false }`. Database error → `500` `{ "ok": false }` (no SQL text, no connection string).

## Test

```bash
npx vitest run
```
