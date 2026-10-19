# BIZON CMS frontend

The CMS is a static Next.js application served locally on port `3001`. It owns the editorial interface and sends authenticated admin requests directly from the browser to `backend-app` at port `4000`. The backend owns PostgreSQL access and media persistence.

## Local development

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_ADMIN_API_URL` to the backend origin. The backend must allow the CMS origin through `CMS_ALLOWED_ORIGINS`; public website origins belong in `CORS_ALLOWED_ORIGINS` and do not receive browser access to admin routes.

The CMS production build is a static export and requires `NEXT_PUBLIC_ADMIN_API_URL` at build time. The GitHub workflow sets a local placeholder for build validation; the deployed artifact must be built with the intended backend origin.

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```
