# BIZON Word Emphasis Design

## Intent

Render each standalone occurrence of the BIZON brand name in bold throughout the public site, while preserving the surrounding text's font family and the original spelling. Exclude all footer content.

## Scope

- Format visible text rendered by React components, including hard-coded copy and data-driven labels.
- Format text nodes inside CMS HTML rendered by `LexicalContent`, without changing the surrounding markup.
- Exclude the footer, identified by its existing site-footer boundary.
- Match the standalone token `BIZON` case-insensitively and preserve the original case in output. A match must not be part of a longer word or identifier. Hyphens and punctuation separate words.
- Apply weight 700 through a semantic `<strong>` element or an equivalent class. Inherit the existing font family, size, color, and other typography.

## Exclusions

- Do not format text in `alt`, `aria-label`, `title`, placeholders, form values, metadata, URLs, or structured data.
- Do not alter image, SVG, or other logo artwork.
- Do not edit CMS source text or other stored content; formatting is a presentation rule.
- Do not change footer typography.

## Approaches

1. **Shared rendering formatter — selected.** Apply one matching rule to React-rendered text at the relevant UI boundaries and visit text nodes in CMS HTML through an HTML-aware transform. This keeps server and client output consistent and avoids rewriting the live DOM. It requires connecting existing visible-text renderers to the formatter.
2. **Runtime DOM observer.** Walk text nodes after hydration and observe later changes, skipping the footer. This touches many outputs automatically but can conflict with React reconciliation, cause flashes, and require extra handling for dynamic content.
3. **Source-only codemod.** Rewrite brand tokens in source literals and CMS data before rendering. This misses runtime strings unless every data source is separately covered, and risks changing stored content rather than presentation.

The shared rendering formatter is preferred because it preserves React's ownership of the DOM, supports server rendering, and keeps one matching rule for both JSX text and CMS HTML.

## Typography

The bold wrapper inherits its parent font family. Variable Bounded and Manrope fonts can use their available bold weights. Doloto is loaded as a regular-only font, so browsers may synthesize bold for that face while retaining its family.

## Acceptance Criteria

- Standalone `BIZON`, `Bizon`, and other case variants appear bold in visible React and CMS-rendered text outside the footer.
- Text adjacent to the match, punctuation, whitespace, links, and other markup remain unchanged.
- Substrings such as `BIZONized` and identifiers such as `MY_BIZON` do not match.
- Footer text, image logos, hidden text attributes, metadata, routes, and stored CMS text remain unchanged.
- Formatted output is deterministic in server-rendered and hydrated views; no post-hydration DOM mutation is needed.
