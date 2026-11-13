# Mobile Navbar Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce empty space around mobile bottom-nav controls and keep shared floating navigation surfaces consistently rounded.

**Architecture:** Adjust the shared `MobileBottomNav` CSS Module to use an intrinsic, centered pill with a viewport cap and compact gaps. Retain the shared pill radius in `FloatingChrome` for BIZON and Shop top navigation. Keep the SiteShell, routes, and current footer spacing unchanged.

**Tech Stack:** Next.js, React, CSS Modules, global CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-11-13-mobile-navbar-layout-design.md`

## Global Constraints

- Keep the mobile breakpoint at `767px` and short-landscape hiding at `430px` height.
- Preserve four navigation items, their current links, labels, active state, and cart badge.
- Keep at least `48px` link height and `12px` minimum viewport inset.
- Do not alter hamburger drawer geometry or desktop navigation composition.
- Do not add or run tests; this request is a focused CSS implementation.

## Review Focus

- Narrow mobile viewport: four links must fit without horizontal overflow or wrapped labels.
- Standard phone viewport: the pill must hug the control group and stay centered.
- BIZON and Shop contexts: shared styles must apply identically.
- Top and bottom floating nav: both must retain the pill radius.
- Short landscape: preserve existing hidden-nav and no-reserved-bottom-space behavior.

---

### Task 1: Compact shared mobile navigation

**Files:**
- Modify: `src/components/layout/MobileBottomNav.module.css`
- Modify: `src/components/chrome/FloatingChrome.module.css`

**Interfaces:**
- Consumes: existing `MobileBottomNav` items, CSS tokens, and responsive visibility rules.
- Produces: a centered content-sized mobile pill and a consistent explicit radius fallback for the top chrome.

- [x] Update the bottom-nav grid to use four explicit intrinsic tracks with a `48px` minimum tap width; change gaps to `clamp(8px, 2.5vw, 16px)`.
- [x] Replace the full-width mobile pill size with `width: fit-content` capped at `calc(100% - 24px)`; retain centered auto margins and add `box-sizing: border-box`.
- [x] Use the same `var(--radius-pill, 999px)` radius expression in `FloatingChrome` and `MobileBottomNav`.
- [x] Review the diff and confirm the existing visibility, short-landscape, route, and footer-reservation rules remain untouched.

