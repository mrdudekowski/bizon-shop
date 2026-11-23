# Live catalog filtering and selection feedback

**Status:** Awaiting user review
**Date:** 2026-11-23

## Goal

Let visitors see tire and wheel catalog results update as soon as they change a filter. When selected filters return no models, show an inline request form on that catalog page so the visitor can ask BIZON for help with selection.

## Current behavior

- Tire filters are held as draft state and normally applied by a GET form submit. A controller then reads the query string and hides non-matching cards.
- Wheel results already recalculate from component state as filter values change, although desktop and mobile still offer separate apply buttons.
- The mobile filter sheet is shared by both catalogs and currently has a submit button.
- The tire and wheel zero-result states contain different copy and neither contains a request form.
- `tire_selection` and `wheel_selection` are existing request source types. The shared contact form already sends requests to the public request API.

## Proposed behavior

### Filtering and URL state

- Apply each changed filter immediately. Do not require a “Показать модели” or equivalent apply button on desktop or in the mobile sheet.
- Keep the URL query parameters as the state that can be copied and revisited. Update filter parameters with client navigation that does not scroll the page or add one browser-history entry per keystroke. Preserve unrelated query parameters.
- On first load and browser navigation, initialize filter controls from valid query values. Keep current filter semantics, option sets, matching rules, reset behavior, and tire category application lock.
- On mobile, update the result count immediately and keep the filter sheet open so visitors can set several filters in sequence. Provide the existing close and reset controls.
- Keep counts and result updates announced accessibly. Do not move focus when results change.

### Zero-result feedback form

- Show the inline form only when a visitor’s active filters produce zero results while the catalog has models available. Keep the existing separate state for a tire category with no published models.
- Use this copy in both catalogs:
  - Heading: **Не нашли подходящую модель?**
  - Supporting text: **Оставьте свои контакты, и наш менеджер свяжется с вами, чтобы помочь с подбором.**
- Reuse the existing contact-request form and submission flow. Ask for name and phone (required), email and company (optional), and an optional comment. Preserve the existing validation, loading, success, and error behavior of the shared form.
- Submit tire requests as `tire_selection` and wheel requests as `wheel_selection`.
- Include the current filter values in the submitted request message so the manager sees the visitor’s selection criteria. Do not create a catalog item or claim compatibility based on an unmatched filter combination.
- On successful submission, keep the visitor on the catalog page and show the existing form success state.

## Data and system boundaries

- No CMS editor changes, database migrations, or new request tables are required.
- Use existing request source types and API. Enforce required phone validation on the backend for both selection request types; browser-only validation is insufficient.
- The public catalog remains the source for filter options and visible models. The feedback form does not publish or modify catalog data.

## Acceptance criteria

1. Changing any tire filter updates the model list and count without submitting a form; the URL reflects the selected filters and loading a copied URL restores them.
2. Changing any wheel filter updates the model list and count without submitting a form; the URL reflects the selected filters and loading a copied URL restores them.
3. Clearing filters restores the unfiltered result and removes only the catalog filter parameters from the URL.
4. On mobile, filter choices update the live count while the sheet stays open; no apply button is required.
5. When tire filters yield zero matches, the exact feedback copy and inline form appear on the tire catalog page. The same is true for wheel filters on the wheel catalog page.
6. The feedback form is absent when results exist and does not replace the distinct “category has no published models” state.
7. Submitting each form sends the correct source type and all active filter values. Success and error states remain visible and accessible.
8. Empty phone submissions are rejected by both client validation and backend validation for `tire_selection` and `wheel_selection`; email remains optional.
9. Existing matching behavior, catalog links, filter options, tire category lock, cart behavior, and BIZON Shop remain unchanged.
10. Verify desktop and mobile catalog layouts, including the mobile sheet, zero-result form, keyboard use, and no horizontal overflow.

## Verification plan

- Unit/component tests for filter parsing, immediate result updates, URL restoration, reset behavior, zero-result forms, submitted source/filter details, and accessible live counts.
- Backend request-validation tests for phone requirements on both selection source types.
- Browser verification on tire and wheel catalogs at desktop and mobile sizes, including a known match and a deliberately non-matching filter combination.
- Do not submit requests to production or alter CMS/catalog data during verification.

## Scope boundaries

- No new search field, product recommendations, model compatibility promises, CMS form builder, notifications, CRM workflow, or catalog content updates.
- Do not change the existing independent behavior of the BIZON and BIZON Shop carts.
- No empty-state form for a category that has no published models unless the user separately requests it.
