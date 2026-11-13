# Mobile Navbar Layout Design

## Intent

Make the shared bottom navigation feel compact on phones by removing the oversized empty sides, while keeping all four links and their tap areas usable. Keep the floating top navigation and bottom navigation consistently pill-shaped wherever they appear.

## Goals

- Let the bottom navigation size itself around its four controls, centered with a small viewport inset.
- Use compact, predictable gaps and preserve readable single-line labels and at least 48px-tall tap targets.
- Keep the same shared behavior for BIZON and BIZON Shop.
- Retain the existing rounded pill treatment on the shared top chrome and bottom navigation.

## Non-goals

- Change navigation destinations, labels, icons, activation, cart count, visibility breakpoints, or desktop navigation composition.
- Change the hamburger drawer into a pill; it is a full-height side panel with a different role.
- Change page/footer spacing: the shared shell already reserves bottom-nav space on mobile and intentionally removes it in short landscape.

## Constraints

- Keep the shared `MobileBottomNav` component and existing CSS Modules.
- Keep mobile-first responsive sizing and explicit grid columns.
- Do not add dependencies or tests for this CSS-only change.

## Approaches

- **Full-width pill with centered controls:** simplest and preserves current width, but retains the blank side areas shown in the screenshots.
- **Content-sized pill:** compact on every phone, but could become cramped on very narrow screens.
- **Recommended: content-sized pill with a viewport max-width and minimum 48px link widths:** removes excess space at normal mobile widths while allowing the shell to clamp safely on narrow screens. Keep the existing shared pill radius for top and bottom chrome.

## Implementation calls

Use the recommended content-sized layout in the shared bottom nav. Keep MainChrome and ShopChrome on their shared `FloatingChrome` pill radius; use the same radius token with a fallback in both shared nav surfaces. Leave the already-present page bottom reservation and short-landscape behavior intact.

