# CMS E2E audit — 2026-10-21

## Scope and safety

- Production CMS: `https://mrdudekowski-bizon-shop-e454.twc1.net`, authenticated session already open in the local browser.
- Tested by reading lists, opening editors, switching tabs, and checking rendered media. No save, publish, status change, user action, upload, or deletion was performed.
- Local CMS: started on `http://127.0.0.1:3001` with the API URL explicitly directed to `127.0.0.1:4000`. No backend was listening there, so no production database or S3 service was contacted.
- Existing local tree was preserved; no application code or data was changed.

## Production journey results

| Area | Result |
|---|---|
| Login/session | Existing admin session remained authorized; the CMS loaded successfully. |
| Tires | Directions list loaded: TBR has 23 models; OTR has 0. The zero may reflect inventory and is not treated as a defect without product confirmation. |
| Wheels | Four model records loaded. |
| Shop | Five categories loaded; category detail and both Shop editor tabs loaded. One category shows no carousel image. |
| Pages | Nine page records loaded. Home editor loaded its search, hero, directions, expertise, and shop-campaign tabs. |
| Materials | List loaded with populated article records. |
| Media | 45 asset records loaded with usage labels. |
| Publications | Review queue loaded and showed no pending packages. |
| Users | Four user records loaded; two active. No user controls were changed. |
| Browser layout | At the browser's 304 px content width, `documentElement.scrollWidth` stayed 304 px on the media list. This is only a narrow-viewport spot check, not a full responsive audit. |

## Confirmed findings

### P2 — CMS media previews use inconsistent URL resolution; a separate S3 object is corrupt

After scrolling the full media list to trigger lazy loading, 7 of its 45 asset previews failed to decode (38 asset previews loaded; the 39th successful image in the DOM was the CMS logo). The failures split into two causes:

- Six records contain site-relative URLs under `/images/premium/...`; four are marked used: `forged-wheel-workshop.png` (wheel type), `branding-tire-branded.jpg`, `branding-tire-plain.jpg` (homepage branding), and `tread-inspection.jpg` (homepage expertise). The two other paths are unused TBR/OTR fallbacks.
- The seventh record is an unused S3 object `test.png`. A direct GET returns HTTP 200 and `image/png`, but the response body is only 16 bytes: the PNG signature plus an incomplete header. It cannot be decoded as an image.

The relative-path cause is a URL contract mismatch, not a failed list request: the API returns the stored URL, and the CMS origin responds to those `/images/premium/...` paths with HTML (`text/html`) rather than image bytes. The files do exist in the root site's local `public/images/premium/` tree. `PlacementFields.tsx` uses `resolveMediaPreviewUrl()` and `NEXT_PUBLIC_SITE_URL`; `MediaLibrary.tsx`, `MediaPicker.tsx`, list thumbnails (tire, wheel, Shop, materials, and pages), and draft-diff previews pass `dataUrl` directly. The same URL field therefore has different resolution behavior across CMS screens. This proves a CMS preview-origin/asset-contract mismatch; it does not prove the public site itself serves them incorrectly.

The S3 record is a separate data-integrity problem. Current backend validation checks only the PNG signature and declared type before storing the bytes; it does not fully decode the image. That permits a truncated file with a valid 8-byte signature to be stored and recorded as PNG. This unused test asset is not evidence that the earlier carousel upload failed for the same reason.

### P2 — “Выбрать из галереи” is missing from production image controls

Checked production image fields in the Shop carousel, Shop category tiles, and the homepage Hero editor. They expose only “Загрузить фото” / “Заменить фото”; none exposes “Выбрать из галереи”. The local CMS branch `frontend-cms-push` and its origin both contain the gallery implementation (`79dbf66`) and follow-up UI tests (`d44f0d9`); the current production DOM does not. This proves a release artifact/source mismatch. The production app page available in Timeweb identifies the backend revision, not the CMS deployment, so the exact cause—wrong CMS project/branch, deployment not run, or stale served build—remains unproven. The UI feature cannot be considered released until the CMS deployment source and artifact are matched to the intended commit.

### P2 — Incorrect Russian plural for one product

The production category list renders “/pritsepy · 1 товаров”. `ShopProductList.tsx` appends the fixed word “товаров” to every numeric count. The public site already has `shopProductCountLabel()` with correct Russian singular/plural rules, while the CMS has duplicated count labels; the data count itself is correct. A second fixed suffix exists in the one-product list footer in `ShopCategoryProducts.tsx`. This is presentation logic duplicated across surfaces, not a backend/data defect.

## Observations not classified as defects

- Opening Shop settings immediately shows “Есть несохранённые правки”. Source code merges categories missing from `shop-home.catalog.tiles` into an in-memory draft, and dirty state compares that normalized draft to the saved snapshot. This explains the behavior; the audit cannot determine whether the intended product workflow is to require a one-time manual save. No save was made.
- OTR having zero models and two active of four users may be valid operational state; no contradictory evidence was found.
- Some page SEO fields looked blank in the editor. Without an authoritative content expectation or public-page comparison, this is not reported as missing data.
- After the extended read-only session, navigating to a CMS list returned the login view. The current backend sets a 12-hour admin-session TTL, so expiry is a plausible expected cause; no login attempt was made and the production session was not re-established.

## Local test run

- `frontend-cms`: `npm test` passed — 31 test files, 123 tests.
- Local browser E2E smoke: CMS served the login screen. Submitting a dummy, non-production login with the API intentionally isolated at `127.0.0.1:4000` displayed the expected connection error: “Не удалось войти. Проверьте подключение и попробуйте ещё раз.”
- A full local authenticated E2E journey could not run: this checkout has no Playwright E2E config/script, and no isolated backend/database fixture was available. Starting the backend was avoided because its local environment configuration could target shared or production services. The unit/UI suite is not evidence of database, S3, save/reload, or publish persistence.

## Follow-up needed

1. Identify the CMS-specific Timeweb deployment and verify its configured repository, branch, deployed revision, and served asset. Align it to the pushed CMS source before treating the gallery feature as released.
2. Establish one media URL contract across API, CMS previews/gallery, and public rendering. Verify site-relative legacy URLs against the configured public-site origin while leaving S3 object URLs intact.
3. Inspect the S3 object's stored size/checksum metadata and upload history; the retrieved object is only 16 bytes. Determine whether it was an invalid source file or a truncated upload before replacing it.
4. Use one Russian count formatter across CMS and public presentation so list and category-editor labels cannot diverge.
5. Add/run the local E2E harness only with a disposable API/database and isolated object storage or deterministic object-store emulator; then test login, list/editor navigation, validation, save/reload, publication, and media upload/select/reload without touching production.
6. Decide whether Shop's initial normalization should remain a dirty draft or be handled as an explicit migration/normalization workflow.
