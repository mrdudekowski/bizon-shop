# Desktop Navbar Design

## Goal

Update the wide-screen BIZON and BIZON Shop navbar to match the supplied reference, while preserving the current mobile and tablet navigation behavior. Add a category-icon switch to BIZON Shop on very wide screens.

## Breakpoints

- Mobile: up to 767 CSS px. Preserve the existing top navbar, its Shop category toggle, and the mobile bottom navigation without visual or behavioral changes.
- Tablet and compact desktop: 768–1279 CSS px. Preserve the current responsive navbar behavior.
- Wide desktop: 1280–1599 CSS px. Apply the desktop navigation positions and icon links below.
- Very wide desktop: 1600 CSS px and wider. Apply the wide desktop layout and enable the Shop category-icon toggle.

The 1600 px threshold keeps the new interaction off typical laptop and standard desktop layouts. Evaluate the boundary at 1599 px and 1600 px.

## Wide Desktop Navigation

### BIZON

- Keep the hamburger at the left, the BIZON wordmark centered, and the cart at the far right.
- Place “Каталог” and “Tire IQ” in the right navigation group, in that order.
- Show a grid icon with “Каталог” and the existing compass icon with “Tire IQ”. Both remain links to their current routes.

### BIZON Shop

- Keep the hamburger at the left, the BIZON wordmark centered, and the cart at the far right.
- Place “Каталог” and “Диски” in the left navigation group, in that order. Both remain links to their current routes.
- Place “Доставка” in the right navigation group. Link it to the current Shop delivery route.
- Remove “Заявка” from the Shop desktop navbar.
- Preserve the BIZON home shortcut in the right group before the cart, represented by the home icon as shown in the reference.

## Very Wide Shop Category Toggle

- At 1600 CSS px and wider, “Каталог” in the Shop left group becomes a button with the catalog grid icon and label.
- Activating it shows the existing published Shop category icons in the centered brand area in place of the wordmark, matching the current mobile top-navbar interaction. The icon links use their existing category routes.
- Reuse the current category list and icon sources: published, menu-visible categories with CMS icon URLs or existing static fallbacks. Do not add a parallel category configuration or change CMS behavior.
- Activating the button again, clicking outside the navbar, scrolling, or activating a category link closes the icon row. A category link then navigates normally.
- Entering or leaving the very-wide breakpoint closes the icon row so state cannot leak between responsive modes.
- The 768–1599 CSS px behavior remains unchanged by this category toggle.

## Icons and Hover Labels

- Use the provided `assets/navbar icon/svg/tire.svg` for “Диски”.
- Use the provided `assets/navbar icon/svg/сar_steering_wheel.svg` for “Доставка”. The first character in this filename is Cyrillic `с`.
- Reuse the existing catalog grid, Tire IQ compass, home, and cart icons where required.
- In the expanded very-wide Shop category row, hovering a category icon displays that category’s label immediately above that same icon, with no transition delay. The label also appears on keyboard focus.
- Do not rely on the browser’s delayed native `title` tooltip. Keep links accessible by their category labels, and ensure tooltip rendering is not clipped by the navbar or obscured by the page.
- Use navbar text color and contrast appropriate to the current light or dark tone.

## Layout and Accessibility

- Keep the wordmark centered when the left and right groups have different widths.
- Preserve existing hit-area and focus-visible behavior. The catalog toggle exposes its expanded state and has an accessible name.
- Keep category links and labels usable with keyboard input. Escape closes the expanded category row.
- Maintain explicit grid tracks and shrink constraints (`min-width: 0`, `max-width: 100%`) in responsive Grid/Flex containers. Category rows and tooltip text must not create horizontal page overflow.

## Out of Scope

- Changes to mobile or tablet navbar behavior.
- Changes to routes, cart behavior, category publication rules, or CMS icon configuration.
- Redesign of the burger menu, cart drawer, or mobile bottom navigation.

## Acceptance Criteria

- At 1280–1599 CSS px, BIZON shows the two icon links on the right; Shop shows Catalog and Disks on the left and Delivery plus the home shortcut on the right, with no Request link.
- At 1600 CSS px, the Shop Catalog button opens the current category icon row in the centered navbar area; it closes through the listed interactions and category links navigate to their existing routes.
- Category labels appear directly above the hovered or keyboard-focused icon without delay, remain readable in both navbar tones, and are not clipped.
- At widths up to 1279 CSS px, mobile and tablet navigation behavior matches the current implementation.
- The centered wordmark, cart, focus indicators, and responsive width constraints remain intact.
