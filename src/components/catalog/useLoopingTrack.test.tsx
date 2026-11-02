// @vitest-environment happy-dom
import { act, createElement, useLayoutEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useLoopingTrack } from "./useLoopingTrack";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let mobileViewport = true;
let breakpointListeners = new Set<(event: MediaQueryListEvent) => void>();

function installViewport(isMobile: boolean) {
  mobileViewport = isMobile;
  breakpointListeners = new Set();
  window.matchMedia = ((query: string) => ({
    get matches() {
      return query === "(max-width: 1023px)" && mobileViewport;
    },
    media: query,
    onchange: null,
    addEventListener(_type: string, listener: EventListenerOrEventListenerObject) {
      if (query === "(max-width: 1023px)") {
        breakpointListeners.add(listener as (event: MediaQueryListEvent) => void);
      }
    },
    removeEventListener(_type: string, listener: EventListenerOrEventListenerObject) {
      breakpointListeners.delete(listener as (event: MediaQueryListEvent) => void);
    },
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  })) as typeof window.matchMedia;
}

function crossBreakpoint(isMobile: boolean) {
  mobileViewport = isMobile;
  const event = { matches: isMobile } as MediaQueryListEvent;
  for (const listener of breakpointListeners) listener(event);
}

function TrackHarness({ count }: { count: number }) {
  const trackRef = useRef<HTMLDivElement>(null);
  useLoopingTrack(trackRef, count);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    [...track.children].forEach((child, index) => {
      Object.defineProperty(child, "offsetLeft", { configurable: true, value: index * 180 });
    });
  }, [count]);

  return createElement(
    "div",
    { ref: trackRef, "data-track": "true" },
    Array.from({ length: count * 2 }, (_, index) => createElement("div", { key: index }, `card ${index % count}`)),
  );
}

describe("useLoopingTrack", () => {
  let host: HTMLDivElement;
  let root: Root;
  let originalOnScrollEnd: PropertyDescriptor | undefined;

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    host?.remove();
    if (originalOnScrollEnd) Object.defineProperty(window, "onscrollend", originalOnScrollEnd);
    else Reflect.deleteProperty(window, "onscrollend");
    vi.useRealTimers();
  });

  async function renderTrack(count: number, mobile = true) {
    installViewport(mobile);
    originalOnScrollEnd = Object.getOwnPropertyDescriptor(window, "onscrollend");
    Object.defineProperty(window, "onscrollend", { configurable: true, value: null });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(TrackHarness, { count }));
    });
  }

  it("continues seamlessly from both physical edges of the duplicated content cycle", async () => {
    await renderTrack(3);
    const track = host.querySelector("[data-track]") as HTMLDivElement;

    // One original cycle is visible at mount; the duplicate cycle provides
    // continuous content on either side of this position.
    expect(track.scrollLeft).toBe(540);

    await act(async () => {
      track.scrollLeft = 0;
      track.dispatchEvent(new Event("scrollend"));
    });
    expect(track.scrollLeft).toBe(540);

    await act(async () => {
      track.scrollLeft = 720;
      track.dispatchEvent(new Event("scrollend"));
    });
    expect(track.scrollLeft).toBe(180);
  });

  it("wraps a two-item track without exposing a finite end", async () => {
    await renderTrack(2);
    const track = host.querySelector("[data-track]") as HTMLDivElement;
    expect(track.scrollLeft).toBe(360);

    await act(async () => {
      track.scrollLeft = 0;
      track.dispatchEvent(new Event("scrollend"));
    });
    expect(track.scrollLeft).toBe(360);

    await act(async () => {
      track.scrollLeft = 500;
      track.dispatchEvent(new Event("scrollend"));
    });
    expect(track.scrollLeft).toBe(140);
  });

  it("repositions the active cycle when crossing mobile to desktop and back", async () => {
    await renderTrack(3);
    const track = host.querySelector("[data-track]") as HTMLDivElement;
    expect(track.scrollLeft).toBe(540);

    await act(async () => {
      crossBreakpoint(false);
    });
    expect(track.scrollLeft).toBe(0);

    await act(async () => {
      crossBreakpoint(true);
    });
    expect(track.scrollLeft).toBe(540);
  });

  it("recenters after an interrupted scroll once the final position settles", async () => {
    await renderTrack(3);
    const track = host.querySelector("[data-track]") as HTMLDivElement;

    await act(async () => {
      track.scrollLeft = 700;
      track.dispatchEvent(new Event("scroll"));
      track.scrollLeft = 620;
      track.dispatchEvent(new Event("scroll"));
      track.dispatchEvent(new Event("scrollend"));
    });

    expect(track.scrollLeft).toBe(80);
  });

  it("does not initialize a loop for zero, one, or desktop-grid content", async () => {
    await renderTrack(1);
    const track = host.querySelector("[data-track]") as HTMLDivElement;
    expect(track.scrollLeft).toBe(0);

    await act(async () => {
      root.render(createElement(TrackHarness, { count: 0 }));
    });
    expect((host.querySelector("[data-track]") as HTMLDivElement).scrollLeft).toBe(0);

    installViewport(false);
    await act(async () => {
      root.render(createElement(TrackHarness, { count: 3 }));
    });
    expect((host.querySelector("[data-track]") as HTMLDivElement).scrollLeft).toBe(0);
  });
});
