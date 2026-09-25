# Forged wheels final review fixes

## Changes

- The forged listing now resolves the published `forged` wheel type through CMS and returns `notFound()` when it is missing or unpublished.
- Shop readiness now blocks each required forged model unless its gallery contains at least three valid Media upload relations.

## Verification

- `npx eslint "src/app/(site)/shop/wheels/[wheelTypeSlug]/page.tsx" "scripts/verify-shop-readiness.ts"` — passed.
- Staging `npm run verify:shop` with `DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:55433/bizon_payload_stage` and S3 variables cleared — exited 1 only for the two already-known missing lifestyle categories; all five forged models passed with no `FORGED_*` blockers.
