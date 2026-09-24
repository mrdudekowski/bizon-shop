# BIZON main-app

Public website (bizon.ru + BIZON Shop) on **Next.js 15**. No Payload CMS — content is static defaults until `backend-app` is connected.

Related branches:

- `backend-app` — API (stub)
- `frontend-cms` — admin UI (stub)

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `/admin` is not served.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build (no database) |
| `npm run test` | Vitest unit tests |
| `npm run lint` | ESLint |

## S3 media (read-only)

Set `S3_PUBLIC_URL` (CDN) so asset keys resolve to remote URLs. Upload and auth live in `backend-app` later.

See [AUDIT.md](./AUDIT.md) for architecture notes.
