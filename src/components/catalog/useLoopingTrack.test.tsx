// @vitest-environment happy-dom
import { act, createElement, useLayoutEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useLoopingTrack } from "./useLoopingTrack";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function installViewport(isMobile: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query === "(max-width: 1023px)" && isMobile,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  })) as typeof window.matchMedia;
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
