# Home Shop Campaign Carousel Editor

## Intent

Let editors change the icon carousel captions from `Pages → Home → Shop Campaign`, where they already edit the campaign background, title, and CTA. Category rows must follow the current Shop category list and reuse each category's icon.

## Current State

- The public home carousel is built from the published `shop-home` page. Its disk caption and category captions are already editable in `Shop → Shop Presentation`.
- Category carousel items are associated by category ID. Their icon is resolved from the Shop tile icon, falling back to the category icon. Public items require the category to be visible, enabled for the carousel, and have a non-empty caption.
- The Shop editor loads the current category list when it opens and merges missing categories into the editor draft. The Home page's `Shop Campaign` editor does not currently show these caption fields.

## Goals

- Show the disk caption and a row for every current Shop category inside `Pages → Home → Shop Campaign`.
- Show each category's current icon and an editable caption field. A newly added category appears when the editor is opened or refreshed, with its icon if configured and an empty caption field otherwise.
- Keep category ordering, visibility, carousel eligibility, icon resolution, and public rendering behavior consistent with the existing Shop carousel.
- Save and publish this block through the existing `shop-home` document workflow, using its own controls independently of the Home page Save/Publish actions.
- Remove the duplicate caption inputs from the Shop presentation editor while retaining its category icon and carousel image controls.

## Non-goals

- No live synchronization into an already open Home editor after another screen creates a category.
- No automatic inclusion of a category in the public carousel while its caption is empty or its existing visibility settings exclude it.
- No database migration or change to the public carousel animation or appearance.

## Approaches

1. **Chosen: move the caption controls into Home → Shop Campaign and keep `shop-home` as the data source.** Reuse the existing category IDs and caption fields, fetch categories when the block opens, and provide the existing Shop save/publish flow in the new location. This avoids a schema migration and preserves public behavior; the trade-off is that the block's actions publish Shop content independently of the surrounding Home page.
2. **Move caption data onto the Home page.** This would align the fields with the campaign's page document, but requires migrating stored captions and changing the published read model and API.
3. **Keep the current Shop editor and add a link from Home → Shop Campaign.** This is the smallest change but leaves editors outside the requested section to change text.

## Implementation Notes

- Extract or reuse the existing category merge and caption editor logic rather than creating another caption source.
- Preserve configured captions by category ID when categories are added, renamed, reordered, or hidden.
- Keep the disk caption editable alongside category captions; the disk entry remains the fixed first carousel item.
- Test the Home editor interaction: category list and icons appear; a new category gets an empty caption field; edits save and publish to `shop-home`; the page-level Home actions remain independent.
- Test the existing public item builder to confirm caption and visibility filters still work.

## Assumption

“Immediately” means the new category appears the next time the Home editor is opened or refreshed, not through live updates while that editor remains open. This was confirmed in the conversation.
