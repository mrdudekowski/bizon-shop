// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ShopCampaign } from "./ShopCampaign";
import type { HomeShopCampaignContent } from "@/lib/content/pages/types";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const REDUCE_MOTION = "(prefers-reduced-motion: reduce)";
const FRAME_MS = 6000;

function installMotion(reduced: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query === REDUCE_MOTION ? reduced : false,
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

function campaign(frames: { imageUrl: string; imageAlt: string }[]): HomeShopCampaignContent {
  return {
    eyebrow: "BIZON SHOP",
    title: "Кованые диски",
    lead: "Смена кадра",
    imageUrl: frames[0]?.imageUrl ?? null,
    imageAlt: frames[0]?.imageAlt ?? "",
    frames,
    cta: { label: "В магазин", href: "/shop" },
  };
}

function activeAlt(host: ParentNode) {
  return host.querySelector("img[data-active='true']")?.getAttribute("alt") ?? "";
}

describe("ShopCampaign", () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    host?.remove();
    vi.useRealTimers();
  });

  async function renderCampaign(content: HomeShopCampaignContent, reduced = false) {
    installMotion(reduced);
    if (root) {
      await act(async () => {
        root.unmount();
      });
      host?.remove();
    }
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(ShopCampaign, { content }));
    });
  }

  it("advances multiple frames and wraps back to the first", async () => {
    vi.useFakeTimers();
    await renderCampaign(campaign([
      { imageUrl: "/one.jpg", imageAlt: "Первый" },
      { imageUrl: "/two.jpg", imageAlt: "Второй" },
    ]));
    expect(activeAlt(host)).toBe("Первый");
    expect(host.querySelector("button")).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(FRAME_MS);
    });
    expect(activeAlt(host)).toBe("Второй");

    await act(async () => {
      vi.advanceTimersByTime(FRAME_MS);
    });
    expect(activeAlt(host)).toBe("Первый");
  });

  it("pauses a multi-frame interval when the campaign receives focus", async () => {
    vi.useFakeTimers();
    await renderCampaign(campaign([
      { imageUrl: "/one.jpg", imageAlt: "Первый" },
      { imageUrl: "/two.jpg", imageAlt: "Второй" },
    ]));
    await act(async () => {
      vi.advanceTimersByTime(FRAME_MS);
    });
    expect(activeAlt(host)).toBe("Второй");

    const cta = host.querySelector("a");
    if (!cta) throw new Error("cta missing");
    await act(async () => {
      cta.focus();
    });
    await act(async () => {
      vi.advanceTimersByTime(FRAME_MS);
    });
    expect(activeAlt(host)).toBe("Второй");
    expect(host.querySelector("button")).toBeNull();
  });

  it("keeps the visible frame when the call to action is used before a pending tick", async () => {
    vi.useFakeTimers();
    await renderCampaign(campaign([
      { imageUrl: "/one.jpg", imageAlt: "Первый" },
      { imageUrl: "/two.jpg", imageAlt: "Второй" },
    ]));
    await act(async () => {
      vi.advanceTimersByTime(FRAME_MS - 1);
    });
    expect(activeAlt(host)).toBe("Первый");

    const cta = host.querySelector("a");
    if (!cta) throw new Error("cta missing");
    await act(async () => {
      cta.focus();
      cta.click();
    });
    await act(async () => {
      vi.advanceTimersByTime(FRAME_MS);
    });
    expect(activeAlt(host)).toBe("Первый");
    expect(host.querySelector("button")).toBeNull();
  });

  it("does not autoplay one frame or when the user prefers reduced motion", async () => {
    vi.useFakeTimers();
    await renderCampaign(campaign([{ imageUrl: "/one.jpg", imageAlt: "Первый" }]));
    await act(async () => {
      vi.advanceTimersByTime(FRAME_MS * 3);
    });
    expect(activeAlt(host)).toBe("Первый");
    expect(host.querySelectorAll("img")).toHaveLength(1);
    expect(host.querySelectorAll("[data-active]")).toHaveLength(1);

    await renderCampaign(campaign([
      { imageUrl: "/one.jpg", imageAlt: "Первый" },
      { imageUrl: "/two.jpg", imageAlt: "Второй" },
    ]), true);
    await act(async () => {
      vi.advanceTimersByTime(FRAME_MS * 3);
    });
    expect(activeAlt(host)).toBe("Первый");
  });
});
