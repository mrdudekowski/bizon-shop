# frontend-cms agent rules

Before working in this repository, read the project-wide rules in ../AGENTS.md. They apply to this repository and take precedence for shared workflows.

## CMS-specific boundaries

- Treat this as the browser-based editorial client. Use its established admin client and API contracts; do not add direct database access to the CMS.
- Inspect the actual adapter behavior before relying on names such as localStore. Verify whether the current flow uses remote API, local fallback, cached state, or a published snapshot.
- Keep draft, saved draft, submitted change set, published data, and public-site deployment status distinct. A successful save is not publication; publication is not proof that the public build is current.
- Enforce capabilities in the backend as well as presenting the correct UI. Do not rely on hidden buttons for authorization.
- For every editor change, consider initial load, validation, save, reload/read-back, unsaved state, API errors, conflict handling, and the user-visible status.
- For media changes, check the asset ID/URL contract, usage links, replacement/deletion behavior, preview origin, and public rendering.
- Keep UI tests behavioral and accessible. Prefer roles, labels, and visible state over source-text assertions or brittle class selectors.
- Preserve responsive rules from ../AGENTS.md. When layout behavior changes, test the actual viewport and computed dimensions.
- Do not publish or write to shared data during tests. CMS E2E must use the isolated database and local storage harness described by the project.

## CMS completion evidence

Report which route/editor and entity were changed, the API operation/contract involved, the user's save/publish journey verified, test commands and results, and whether a public-site result was checked. State explicitly when database-backed E2E was blocked.
