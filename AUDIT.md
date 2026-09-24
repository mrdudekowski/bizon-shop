# main-app audit (pre-Payload removal)

## Critical — block split

| Priority | Issue | Action |
|----------|-------|--------|
| P0 | `src/lib/cms/payload/query.ts` → Payload Local API | **DELETE**; replace with `src/lib/content/staticProvider.ts` |
| P0 | `src/payload-types.ts` | **DELETE**; use `src/lib/content/types.ts` |
| P0 | `next.config.mjs` `withPayload` | **REFACTOR** plain Next config |
| P0 | `(payload)/`, `payload.config.ts`, collections, migrations | **DELETE** |
| P0 | `/api/requests`, `/api/cart` write to Payload | **STUB** / local-only cart |
| P1 | `LexicalContent` → `@payloadcms/richtext-lexical` | **REPLACE** with HTML/fallback |
| P1 | `withPayload` silent null | **REMOVED** with static provider |

## Modularity / SSOT

| Issue | Action |
|-------|--------|
| `constants/shopCategories` vs CMS slugs | **KEEP** constants for static menu until backend-app |
| Page defaults in `lib/cms/pages/defaults` | **MOVE** to `lib/content/pages/defaults` — stage-1 SSOT |
| `lib/cms/types.ts` public shapes | **MOVE** to `lib/content/types.ts` — HTTP contract later |
| `collections/Pages.ts` imports page fields | **DELETE** with Payload |
| Site + Shop `SiteShell` | **KEEP** single main-app |

## Do not ship on main-app

- `src/app/(payload)/**`, `src/collections/**`, `src/migrations/**`, `src/payload/**`, `src/payload-admin/**`
- `scripts/*` (seed/import/verify), `import-templates/`, `.agents/`, `.codex-doc-review/`, `docs/superpowers/`, `tmp/`
- `@payloadcms/*`, `payload`, `graphql`

## Keep

- `src/app/(site)/**`, `src/components/**` (no payload-admin)
- `src/lib/selection/**`, `src/lib/catalog/**` (read model; empty catalog OK)
- `src/lib/seo/**`, `src/lib/analytics/**`, `src/constants/**`, `public/**`
- `src/lib/storage/**`, `src/lib/media/**` (new S3 URL layer)
